"""
Fetch and parse item data from ARC Raiders Wiki
Reads item names from a text file and constructs detailed JSON database
"""

import html
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup


def sanitize_item_name_for_url(item_name: str) -> str:
    """Convert item name to URL-safe format (spaces to underscores)."""
    return item_name.replace(' ', '_')


def clean_text(text: str) -> str:
    """Clean text by decoding HTML entities and normalizing whitespace."""
    if not text:
        return text
    # Decode HTML entities like &nbsp;, &amp;, etc.
    text = html.unescape(text)
    # Normalize whitespace
    text = ' '.join(text.split())
    return text.strip()


def parse_infobox(source_text: str, item_name: str) -> Dict[str, Any]:
    """Parse the Infobox template from MediaWiki source."""
    infobox_data = {}
    
    # Find the infobox section
    infobox_match = re.search(r'\{\{Infobox[^\n]*\n(.*?)\n\}\}', source_text, re.DOTALL)
    
    if not infobox_match:
        return infobox_data
    
    infobox_content = infobox_match.group(1)
    
    # Fields that should be converted to numbers
    float_fields = {'weight', 'range', 'agility', 'firerate', 'stability', 'stealth', 
                    'damage', 'sCharge', 'damageM', 'Movepen', 'wlimit', 'healing',
                    'usetime', 'duration', 'radius'}
    int_fields = {'stacksize', 'magsize', 'bslots', 'spslots', 'quslots', 'wslots'}
    
    # Collect function fields (fun1, fun2, fun3, etc.) for weapon mods
    function_fields = {}
    
    # Parse each parameter (|key=value)
    lines = infobox_content.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('|') and '=' in line:
            # Remove leading pipe and split on first =
            line = line[1:]
            parts = line.split('=', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()
                
                if not value:
                    infobox_data[key] = None
                    continue
                
                # Clean up MediaWiki syntax - replace PAGENAME with actual item name
                value = re.sub(r'\{\{PAGENAME\}\}', item_name, value)
                
                # Handle sellprice specially - may have multiple Price tags for weapon levels
                if key == 'sellprice':
                    # Extract all prices from {{Price|value}} patterns
                    prices = re.findall(r'\{\{Price\|([^}]+)\}\}', value)
                    if prices:
                        # Convert to integers, removing commas
                        price_list = []
                        for p in prices:
                            p_clean = p.replace(',', '').strip()
                            try:
                                price_list.append(int(p_clean))
                            except ValueError:
                                pass
                        
                        # Store as single value or array
                        if len(price_list) == 1:
                            infobox_data[key] = price_list[0]
                        elif len(price_list) > 1:
                            infobox_data[key] = price_list
                        else:
                            # Fallback if no prices parsed
                            value_clean = value.replace(',', '').strip()
                            try:
                                infobox_data[key] = int(value_clean)
                            except ValueError:
                                infobox_data[key] = value
                    else:
                        # No Price tags, just parse as integer
                        value_clean = value.replace(',', '').strip()
                        try:
                            infobox_data[key] = int(value_clean)
                        except ValueError:
                            infobox_data[key] = value
                    continue
                
                # Remove any remaining Price tags
                value = re.sub(r'\{\{Price\|([^}]+)\}\}', r'\1', value)
                
                # Handle weapon mod function fields (fun1, fun2, fun3, etc.)
                if key.startswith('fun') and key[3:].isdigit():
                    function_fields[int(key[3:])] = clean_text(value)
                    continue
                
                # Handle warning field (contains compatible weapons for mods)
                if key == 'warning':
                    # Extract weapon names from wiki links [[Weapon]]
                    weapon_links = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', value)
                    if weapon_links:
                        infobox_data['compatible_weapons'] = [clean_text(w) for w in weapon_links]
                    # Also keep the original text
                    infobox_data[key] = clean_text(value)
                    continue
                
                # Convert numeric fields to appropriate types
                if key in float_fields:
                    # Remove percentage signs and try to convert
                    value_clean = value.replace('%', '').replace(',', '').strip()
                    try:
                        infobox_data[key] = float(value_clean)
                    except ValueError:
                        infobox_data[key] = clean_text(value)
                elif key in int_fields:
                    value_clean = value.replace(',', '').strip()
                    try:
                        infobox_data[key] = int(value_clean)
                    except ValueError:
                        infobox_data[key] = clean_text(value)
                else:
                    infobox_data[key] = clean_text(value)
    
    # Group function fields into a list (for weapon mods)
    if function_fields:
        # Sort by index and create list
        sorted_functions = [function_fields[i] for i in sorted(function_fields.keys())]
        infobox_data['functions'] = sorted_functions
    
    return infobox_data


def parse_list_items(section_text: str) -> List[str]:
    """Parse bullet point list items from a section."""
    items = []
    lines = section_text.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('*'):
            # Remove leading asterisk and wiki links
            item = line[1:].strip()
            item = re.sub(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', r'\1', item)
            if item:
                items.append(clean_text(item))
    return items


def parse_recipe_table(table_text: str, table_type: str) -> List[Dict[str, Any]]:
    """Parse crafting/upgrade/repair table."""
    recipes = []
    
    lines = table_text.split('\n')
    current_recipe = {}
    in_row = False
    column_index = 0
    
    for line in lines:
        line = line.strip()
        
        if line == '|-':
            if current_recipe and any(current_recipe.values()):
                recipes.append(current_recipe)
            current_recipe = {}
            in_row = True
            column_index = 0
            continue
        
        if not in_row or not line.startswith('|'):
            continue
        
        # Remove leading pipe
        line = line[1:].strip()
        
        # Skip header rows and arrow columns
        if line.startswith('!') or line == "'''→'''" or line == '→':
            continue
        
        # For repair tables, the first column is the item name
        if table_type == 'repair' and column_index == 0:
            # Extract item name from repair table
            item_match = re.search(r"'''([^']+)'''", line)
            if item_match:
                current_recipe['item_name'] = clean_text(item_match.group(1))
            column_index += 1
            continue
        
        # Parse the cell content
        # For upgrade tables, first check if this is an input/output level (e.g., "Kettle I")
        # These appear as plain text without wiki links
        if table_type == 'upgrade' and not '[[' in line and not 'style=' in line and re.search(r'\b(I{1,3}|IV)\b', line):
            # This might be an input or output level
            level_text = clean_text(line.strip())
            if 'input_level' not in current_recipe:
                current_recipe['input_level'] = level_text
            elif 'output_level' not in current_recipe:
                current_recipe['output_level'] = level_text
            column_index += 1
            continue
        
        # Extract materials/items
        if '<br>' in line or '[[' in line:
            # This might be a recipe or materials list
            materials = []
            input_level = None
            
            parts = re.split(r'<br>|<br/>', line)
            for part in parts:
                # Extract quantity and item name
                part = part.strip()
                
                # Check if this part is an input level (e.g., "Kettle I" for upgrades)
                if table_type == 'upgrade' and not '[[' in part and re.search(r'\b(I{1,3}|IV)\b', part):
                    input_level = clean_text(part)
                    continue
                
                match = re.search(r"(\d+)x\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", part)
                if match:
                    materials.append({
                        "quantity": int(match.group(1)),
                        "item": clean_text(match.group(2))
                    })
                elif '[[' in part:
                    item_match = re.search(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', part)
                    if item_match:
                        materials.append({"item": clean_text(item_match.group(1))})
            
            if table_type == 'upgrade' and input_level:
                current_recipe['input_level'] = input_level
            
            if materials:
                if 'recipe' not in current_recipe:
                    current_recipe['recipe'] = materials
                elif 'result' not in current_recipe:
                    current_recipe['result'] = materials
        
        # Check for workshop level
        workshop_match = re.search(r'(Workbench|Gunsmith|Medical Lab|Gear Bench|Explosives Station|Utility Station|Refiner|Inventory)\s*(\d+)?', line, re.IGNORECASE)
        if workshop_match:
            workshop = clean_text(workshop_match.group(1))
            level = workshop_match.group(2)
            current_recipe['workshop'] = f"{workshop} {level}" if level else workshop
        
        # Check for skill/blueprint locked
        if 'Yes' in line and 'Blueprint' not in line and 'Skill' not in line:
            if 'blueprint_locked' not in current_recipe:
                current_recipe['blueprint_locked'] = True
        
        # Parse upgrade perks (only for upgrade table, not repair)
        if table_type == 'upgrade' and ('style="text-align:left;"' in line or 
                                        ('Increased' in line or 'Reduced' in line) and '[[' not in line):
            perks_text = re.sub(r'<br>|<br/>', '\n', line)
            perks_text = re.sub(r'style="[^"]*"', '', perks_text)
            perks_text = re.sub(r'\|+', '', perks_text)  # Remove leading pipes
            perks_text = perks_text.strip()
            if perks_text and '→' not in perks_text:
                # Split into list of perks
                perks_list = [clean_text(p.strip()) for p in perks_text.split('\n') if p.strip()]
                current_recipe['upgrade_perks'] = perks_list
        
        # For craft tables that result in specific levels (e.g., "Kettle I")
        if table_type == 'craft' and not '[[' in line and not 'style=' in line and re.search(r'\b(I{1,3}|IV)\b', line):
            current_recipe['result_level'] = clean_text(line.strip())
        
        # Parse durability for repair
        if '+' in line and line.replace('+', '').replace(' ', '').isdigit():
            durability_value = line.strip().replace('+', '')
            try:
                current_recipe['durability'] = int(durability_value)
            except ValueError:
                current_recipe['durability'] = line.strip()
        
        column_index += 1
    
    # Add the last recipe
    if current_recipe and any(current_recipe.values()):
        recipes.append(current_recipe)
    
    return recipes


def parse_recycling_table(source_text: str) -> Dict[str, Any]:
    """Parse recycling and salvaging data from Recycling table template."""
    recycling_data = {
        "recycling": [],
        "salvaging": []
    }
    
    # Find {{Recycling table ... }}
    recycling_match = re.search(r'\{\{Recycling table(.*?)\}\}', source_text, re.DOTALL)
    
    if not recycling_match:
        return recycling_data
    
    content = recycling_match.group(1)
    
    # Parse parameters
    lines = content.split('\n')
    current_input = None
    
    for line in lines:
        line = line.strip()
        if not line.startswith('|'):
            continue
        
        line = line[1:].strip()
        if '=' not in line:
            continue
        
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        
        if not value:
            continue
        
        # Handle input levels
        if key.startswith('input'):
            current_input = value
        
        # Handle recycling
        elif key.startswith('recycling'):
            # Parse materials
            materials = []
            parts = re.split(r'\s*\+\s*', value)
            for part in parts:
                match = re.match(r'(\d+)\s+(.+)', part.strip())
                if match:
                    materials.append({
                        "quantity": int(match.group(1)),
                        "item": match.group(2).strip()
                    })
            
            if materials:
                entry = {"materials": materials}
                if current_input:
                    entry["input"] = current_input
                recycling_data["recycling"].append(entry)
        
        # Handle salvaging
        elif key.startswith('salvaging'):
            if not value:
                continue
            materials = []
            parts = re.split(r'\s*\+\s*', value)
            for part in parts:
                match = re.match(r'(\d+)\s+(.+)', part.strip())
                if match:
                    materials.append({
                        "quantity": int(match.group(1)),
                        "item": match.group(2).strip()
                    })
            
            if materials:
                entry = {"materials": materials}
                if current_input:
                    entry["input"] = current_input
                recycling_data["salvaging"].append(entry)
    
    return recycling_data


def extract_section(source_text: str, section_title: str) -> Optional[str]:
    """Extract a specific section from MediaWiki source."""
    # Look for === Section Title ===
    pattern = rf'===\s*{re.escape(section_title)}\s*===\s*\n(.*?)(?=\n===|\n==|\Z)'
    match = re.search(pattern, source_text, re.DOTALL | re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    return None


def extract_image_url_from_wiki_page(wiki_url: str) -> Optional[Dict[str, str]]:
    """Fetch the wiki page and extract the actual image URL from the infobox."""
    try:
        response = requests.get(wiki_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the infobox image
        infobox_image = soup.find('tr', class_=lambda x: x and 'infobox-image' in x)
        
        if not infobox_image:
            return None
        
        # Find the img tag
        img_tag = infobox_image.find('img')
        
        if not img_tag:
            return None
        
        # Get the src (webp thumb) and srcset (higher resolution)
        src = img_tag.get('src', '')
        srcset = img_tag.get('srcset', '')
        
        image_urls = {}
        
        # The src typically contains the webp thumb
        if src:
            image_urls['thumb'] = f"https://arcraiders.wiki{src}"
        
        # Parse srcset for higher resolution
        if srcset:
            # srcset format: "/w/images/3/31/Advanced_ARC_Powercell.png 1.5x"
            srcset_parts = srcset.split()
            if srcset_parts:
                original_path = srcset_parts[0]
                image_urls['original'] = f"https://arcraiders.wiki{original_path}"
        
        # Also try to get the file page link
        file_link = infobox_image.find('a', href=lambda x: x and '/wiki/File:' in x)
        if file_link:
            image_urls['file_page'] = f"https://arcraiders.wiki{file_link.get('href', '')}"
        
        return image_urls if image_urls else None
        
    except Exception as e:
        print(f"    [WARNING] Could not fetch image from wiki page: {e}")
        return None


def parse_item_from_wiki(item_name: str, delay: float = 0.5, include_raw: bool = False) -> Optional[Dict[str, Any]]:
    """Fetch and parse a single item from the wiki."""
    print(f"Processing: {item_name}")
    
    url_name = sanitize_item_name_for_url(item_name)
    source_url = f"https://arcraiders.wiki/w/index.php?title={quote(url_name)}&action=edit"
    wiki_url = f"https://arcraiders.wiki/wiki/{quote(url_name)}"
    
    try:
        # Fetch the edit page to get source
        response = requests.get(source_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the textarea with source code
        textarea = soup.find('textarea', {'id': 'wpTextbox1'})
        
        if not textarea:
            print(f"  [!] Could not find source for {item_name}")
            return None
        
        source_text = textarea.get_text()
        
        # Parse the data
        item_data = {
            "name": item_name,
            "wiki_url": wiki_url,
            "source_url": source_url,
        }
        
        # Parse infobox
        infobox = parse_infobox(source_text, item_name)
        if infobox:
            item_data["infobox"] = infobox
            
            # Fetch actual image URLs from the wiki page
            if 'image' in infobox and infobox['image']:
                # Small delay between requests to be respectful
                time.sleep(0.2)
                print(f"  -> Fetching image URL from wiki page...")
                image_urls = extract_image_url_from_wiki_page(wiki_url)
                if image_urls:
                    item_data["image_urls"] = image_urls
        
        # Parse sources section
        sources_section = extract_section(source_text, 'Sources')
        if sources_section:
            item_data["sources"] = parse_list_items(sources_section)
        
        # Parse crafting section
        crafting_section = extract_section(source_text, 'Required Materials to Craft')
        if crafting_section:
            recipes = parse_recipe_table(crafting_section, 'craft')
            if recipes:
                item_data["crafting"] = recipes
        
        # Parse upgrade section (for weapons/augments)
        upgrade_section = extract_section(source_text, 'Required Materials to Upgrade')
        if upgrade_section:
            upgrades = parse_recipe_table(upgrade_section, 'upgrade')
            if upgrades:
                item_data["upgrades"] = upgrades
        
        # Parse repair section
        repair_section = extract_section(source_text, 'Required Materials to Repair')
        if repair_section:
            repairs = parse_recipe_table(repair_section, 'repair')
            if repairs:
                item_data["repairs"] = repairs
        
        # Parse recycling section
        recycling_data = parse_recycling_table(source_text)
        if recycling_data['recycling'] or recycling_data['salvaging']:
            item_data["recycling"] = recycling_data
        
        # Store raw source for reference (optional, makes file much larger)
        if include_raw:
            item_data["raw_source"] = source_text
        
        print(f"  [OK] Successfully parsed {item_name}")
        
        # Be respectful to the server (we made 2 requests: source + wiki page)
        time.sleep(delay)
        
        return item_data
        
    except requests.RequestException as e:
        print(f"  [ERROR] Error fetching {item_name}: {e}")
        return None
    except Exception as e:
        print(f"  [ERROR] Error parsing {item_name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main function to process items from names file."""
    data_dir = Path(__file__).parent.parent / "data"
    
    # Parse command line arguments
    import sys
    include_raw = '--include-raw' in sys.argv
    args = [arg for arg in sys.argv[1:] if not arg.startswith('--')]
    
    if args:
        names_file = data_dir / args[0]
        output_file = data_dir / args[0].replace('.txt', '_database.json')
    else:
        names_file = data_dir / "names.txt"
        output_file = data_dir / "items_database.json"
    
    # Check if names file exists
    if not names_file.exists():
        print(f"Error: {names_file} not found!")
        print("Please create a names.txt file with one item name per line.")
        return
    
    # Read item names
    with open(names_file, 'r', encoding='utf-8') as f:
        item_names = [line.strip() for line in f if line.strip()]
    
    print(f"Found {len(item_names)} items to process\n")
    
    # Process each item
    items_database = []
    failed_items = []
    
    for i, item_name in enumerate(item_names, 1):
        print(f"[{i}/{len(item_names)}] ", end='')
        
        item_data = parse_item_from_wiki(item_name, include_raw=include_raw)
        
        if item_data:
            items_database.append(item_data)
        else:
            failed_items.append(item_name)
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(items_database, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"[OK] Successfully processed: {len(items_database)} items")
    print(f"[FAILED] Failed: {len(failed_items)} items")
    
    if failed_items:
        print("\nFailed items:")
        for item in failed_items:
            print(f"  - {item}")
    
    print(f"\n[OK] Database saved to: {output_file}")
    print(f"  Total size: {output_file.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()

