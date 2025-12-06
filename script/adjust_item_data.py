"""
Adjust item data for specific items that need manual corrections
"""

import json
from pathlib import Path


def build_special_types_map(special_types_data: dict) -> dict:
    """Build a comprehensive map of item_name -> special type details."""
    items_map = {}
    
    # Process workshop_upgrade (nested by workshop and level)
    workshop_data = special_types_data.get("workshop_upgrade", {})
    for workshop_name, levels in workshop_data.items():
        for level_key, items in levels.items():
            level_num = int(level_key.replace("level_", ""))
            for item_entry in items:
                item_name = item_entry["item"]
                quantity = item_entry["quantity"]
                
                if item_name not in items_map:
                    items_map[item_name] = {"special_types": set(), "workshop_upgrades": [], "expedition_parts": [], "quests": []}
                
                items_map[item_name]["special_types"].add("workshop_upgrade")
                items_map[item_name]["workshop_upgrades"].append({
                    "workshop": workshop_name,
                    "level": level_num,
                    "quantity": quantity
                })
    
    # Process expedition (nested by part)
    expedition_data = special_types_data.get("expedition", {})
    for part_key, part_value in expedition_data.items():
        # Skip non-item parts (part_5 and part_6 have special structure)
        if not isinstance(part_value, list):
            continue
        
        part_num = int(part_key.replace("part_", ""))
        for item_entry in part_value:
            item_name = item_entry["item"]
            quantity = item_entry["quantity"]
            
            if item_name not in items_map:
                items_map[item_name] = {"special_types": set(), "workshop_upgrades": [], "expedition_parts": [], "quests": []}
            
            items_map[item_name]["special_types"].add("expedition")
            items_map[item_name]["expedition_parts"].append({
                "part": part_num,
                "quantity": quantity
            })
    
    # Process quest (nested by quest name)
    quest_data = special_types_data.get("quest", {})
    for quest_name, items in quest_data.items():
        for item_entry in items:
            item_name = item_entry["item"]
            quantity = item_entry["quantity"]
            note = item_entry.get("note")
            
            if item_name not in items_map:
                items_map[item_name] = {"special_types": set(), "workshop_upgrades": [], "expedition_parts": [], "quests": []}
            
            items_map[item_name]["special_types"].add("quest")
            quest_detail = {"quest": quest_name, "quantity": quantity}
            if note:
                quest_detail["note"] = note
            items_map[item_name]["quests"].append(quest_detail)
    
    # Process simple lists (safe_to_recycle, crafting_material, scrappy_items)
    for list_key in ["safe_to_recycle", "crafting_material", "scrappy_items"]:
        items_list = special_types_data.get(list_key, [])
        for item_name in items_list:
            if item_name not in items_map:
                items_map[item_name] = {"special_types": set(), "workshop_upgrades": [], "expedition_parts": [], "quests": []}
            items_map[item_name]["special_types"].add(list_key)
    
    # Convert sets to sorted lists
    for item_name in items_map:
        items_map[item_name]["special_types"] = sorted(list(items_map[item_name]["special_types"]))
    
    return items_map


def adjust_item_data():
    """Apply manual corrections to item database."""
    data_dir = Path(__file__).parent.parent / "data"
    database_file = data_dir / "items_database.json"
    special_types_file = data_dir / "special_item_types.json"
    
    if not database_file.exists():
        print(f"Error: {database_file} not found!")
        return
    
    with open(database_file, 'r', encoding='utf-8') as f:
        items_database = json.load(f)
    
    # Load special item types with detailed parsing
    special_types_map = {}
    if special_types_file.exists():
        with open(special_types_file, 'r', encoding='utf-8') as f:
            special_types_data = json.load(f)
        special_types_map = build_special_types_map(special_types_data)
    
    # Define adjustments
    type_adjustments = {
        "Augment": [
            "Free Loadout Augment", "Looting Mk. 1", "Combat Mk. 1", "Tactical Mk. 1",
            "Looting Mk. 2", "Combat Mk. 2", "Tactical Mk. 2",
            "Looting Mk. 3 (Cautious)", "Looting Mk. 3 (Survivor)",
            "Combat Mk. 3 (Aggressive)", "Combat Mk. 3 (Flanking)",
            "Tactical Mk. 3 (Defensive)", "Tactical Mk. 3 (Healing)",
        ],
        "Shield": ["Light Shield", "Medium Shield", "Heavy Shield"],
        "Ammo": [
            "Light Ammo", "Medium Ammo", "Heavy Ammo", 
            "Shotgun Ammo", "Launcher Ammo", "Energy Clip"
        ],
    }
    
    price_adjustments = {
        # "Magnetron": 6000,
        # "Rotary Encoder": 3000,
    }
    
    image_adjustments = {
        # "Radio Relay": "https://arcraiders.wiki/w/images/thumb/b/b6/Radio_Relay.png/348px-Radio_Relay.png.webp",
    }
    
    updated = 0
    
    # Apply adjustments
    for item in items_database:
        if 'infobox' not in item:
            item['infobox'] = {}
        
        # Type adjustments
        for item_type, names in type_adjustments.items():
            if item['name'] in names:
                item['infobox']['type'] = item_type
                updated += 1
        
        # Special type adjustments (with detailed info)
        if item['name'] in special_types_map:
            item_data = special_types_map[item['name']]
            item['infobox']['special_types'] = item_data['special_types']
            
            if item_data['workshop_upgrades']:
                item['infobox']['workshop_upgrades'] = item_data['workshop_upgrades']
            
            if item_data['expedition_parts']:
                item['infobox']['expedition_parts'] = item_data['expedition_parts']
            
            if item_data['quests']:
                item['infobox']['quests'] = item_data['quests']
            
            updated += 1
        
        # Price adjustments
        if item['name'] in price_adjustments:
            item['infobox']['sellprice'] = price_adjustments[item['name']]
            updated += 1
        
        # Image adjustments
        if item['name'] in image_adjustments:
            if 'image_urls' not in item:
                item['image_urls'] = {}
            item['image_urls']['thumb'] = image_adjustments[item['name']]
            updated += 1
    
    # Save database
    with open(database_file, 'w', encoding='utf-8') as f:
        json.dump(items_database, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} item fields")


if __name__ == "__main__":
    adjust_item_data()

