"""Public AMT address rules adapted from the copy provided by Juan Lopez.

The original parser and review logic run locally. The lookup lists below
contain common example abbreviations for the fictional demo.
"""
import json
import re

STREET_TYPES = {
    "ST": "Street", "STREET": "Street", "RD": "Road", "ROAD": "Road",
    "AVE": "Avenue", "AVENUE": "Avenue", "DR": "Drive", "DRIVE": "Drive",
    "BLVD": "Boulevard", "BOULEVARD": "Boulevard", "LN": "Lane", "LANE": "Lane",
    "CT": "Court", "COURT": "Court", "CRES": "Crescent", "CRESCENT": "Crescent",
    "HWY": "Highway", "HIGHWAY": "Highway", "PL": "Place", "PLACE": "Place",
}
UNIT_TYPES = {"UNIT": "Unit", "APT": "Apartment", "APARTMENT": "Apartment",
              "SUITE": "Suite", "STE": "Suite"}
DIRECTIONS = {"N": "N", "S": "S", "E": "E", "W": "W", "NE": "NE", "NW": "NW",
              "SE": "SE", "SW": "SW", "NORTH": "N", "SOUTH": "S", "EAST": "E", "WEST": "W"}
DEMO_PROVINCES = {"NORTH": "ON", "SOUTH": "NS", "WEST": "BC"}

CANADIAN_PROVINCES = {
    "ON","QC","BC","AB","MB",
    "SK","NS","NB","NL","PE","YT","NT","NU"
}


USA_STATES = {
    "AL","AK","AZ","AR","CA","CO","CT","DE",
    "FL","GA","HI","ID","IL","IN","IA","KS",
    "KY","LA","ME","MD","MA","MI","MN","MS",
    "MO","MT","NE","NV","NH","NJ","NM","NY",
    "NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV",
    "WI","WY","DC"
}


def parse_street(address):
    result = {
        "Unit_Type": "",
        "Unit_Number": "",
        "Street_Number": "",
        "Street_Name": "",
        "Street_Type": "",
        "Street_Type_First": "",
        "Street_Direction": "",
        "Lot_Number": "",
        "Site": "",
        "Comp": "",
        "Rural_Route_Number": "",
        "PO_Box": "",
        "STN_Name": "",
    }
    if not address:
        return result

    address = str(address).strip()

    address = (
        address
        .replace("-Unit", "Unit")
        .replace("-UNIT", "UNIT")
        .replace("-Apt", "Apt")
        .replace("-APT", "APT")
        .replace("-Suite", "Suite")
        .replace("-SUITE", "SUITE")
        .replace("-Ste", "Ste")
        .replace("-STE", "STE")

    )

    address = re.sub(
        r'(?i)(rd|road|st|street|ave|avenue|dr|drive|blvd|hwy|highway)(unit|apt|suite|ste)',
        r'\1 \2',
        address
    )

    tokens = (
        address.upper()
        .replace(",", " ")
        .replace(".", "")
        .split()
    )

    #
    joined = " ".join(tokens)
    #POBOX

    normalized = (
        joined.upper()
        .replace(".", "")
        .replace(",", "")
    )
    normalized = re.sub(r"\s+", " ", normalized)

    # Standalone STN
    stn_match = re.search(
        r"\bSTN\s+([A-Z0-9 ]+)",
        normalized
    )

    if stn_match:
        result["STN_Name"] = stn_match.group(1).strip().title()


    # Standalone RPO
    rpo_match = re.search(
        r"\bRPO\s+([A-Z0-9 ]+)",
        normalized
    )

    if rpo_match and result["STN_Name"] == "":
        result["STN_Name"] = rpo_match.group(1).strip().title()


    po_match = re.search(r"\bP\s*O\s*BOX\s*#?\s*(\w+)", normalized)
    if po_match:
        result["PO_Box"] = po_match.group(1)

        # Site number in a mailbox address
        site_match = re.search(r"\bSITE\s+(\w+)", normalized)
        if site_match:
            result["Site"] = site_match.group(1)


    lot_match = re.search(r"\bLOT\s+(\w+)", normalized)

    if lot_match:
        result["Lot_Number"] = lot_match.group(1)


    comp_match = re.search(
        r"\bCOMP\s+(\w+)",
        normalized
    )

    if comp_match:
        result["Comp"] = comp_match.group(1)


    #RPO OR STN name
    rpo_match = re.search(r"\b(RPO\STN)\s+(.+)$", normalized)

    if rpo_match:
        stn_text = rpo_match.group(2)

        stn_text = re.sub(r"\bSITE\s+\w+", "", stn_text).strip()
        result["STN_Name"] = stn_text.title()

    tokens = [
        token for token in tokens
        if token not in ["P", "O", "PO", "BOX", "RPO", "STN", "SITE"]
        and token != result["PO_Box"]
        and token != result["Site"]
        ]

    compact_unit_match = re.match(
        r"^([A-Z]?\d+[A-Z]?|\d+[A-Z]?|[A-Z])[- ]+(\d+[A-Z]?)\s+(.+)$", address.upper()
    )

    if compact_unit_match and result["Street_Number"] == "":
        result["Unit_Type"] = "Unit"
        result["Unit_Number"] = compact_unit_match.group(1)
        result["Street_Number"] = compact_unit_match.group(2)

        address = compact_unit_match.group(3).strip()
        tokens = (
            address.upper()
            .replace(",", " ")
            .replace(".", "")
            .split()
        )

    # Unit followed by a street number
    dash_match = re.match(r"^([A-Z]+|\d+[A-Z]?|[A-Z]\d+)\s*-\s*(\d+[A-Z]?)\s+(.+)$", address.upper())

    if dash_match:
        result["Unit_Type"] = "Unit"
        result["Unit_Number"] = dash_match.group(1).strip()
        result["Street_Number"] = dash_match.group(2).strip()

        address = dash_match.group(3).strip()
        tokens = (
            address.upper()
            .replace(",", " ")
            .replace(".", "")
            .split()
        )


    #Rural Route at end like Rd RR8
    rr_match = re.search(r"\bRR\s*#?\s*(\d+)\b", " ".join(tokens))

    if rr_match:
        result["Rural_Route_Number"] = rr_match.group(1)

        filtered = []
        skip_next = False

        for i, token in enumerate(tokens):
            if skip_next:
                skip_next = False
                continue
            if re.fullmatch(r"RR#?\d+", token):
                continue
            if token == "RR" and i + 1 < len(tokens) and tokens[i + 1].isdigit():
                skip_next = True
                continue

            filtered.append(token)
        tokens = filtered

    tokens = [token for token in tokens if token not in ["-", ""]]
    if tokens and tokens[0].startswith("-"):
        tokens[0] = tokens[0][1:]

    if len(tokens) >= 2 and tokens[0] in ["UNIT", "UNITS"]:
        result["Unit_Type"] = "Unit"
        result["Unit_Number"] = tokens[1]
        del tokens[0:2]

    #unit, apt and suite anywhere in address
    for i, token in enumerate(tokens):
        if token in UNIT_TYPES and i + 1 < len(tokens):
            result["Unit_Type"] = UNIT_TYPES[token]
            result["Unit_Number"] = tokens[i + 1]
            del tokens[i:i+2]
            break


    #street number
    if tokens and result["Street_Number"] == "" and re.match(r"^\d+[A-Z]?$", tokens[0]):
        result["Street_Number"] = tokens.pop(0)

    #Directions at the end
    if tokens and tokens[-1] in DIRECTIONS:
        direction_token = tokens.pop()
        result["Street_Direction"] = DIRECTIONS[direction_token]

    #Street type at the end
    if tokens and tokens[-1] in STREET_TYPES:
        street_type_token = tokens.pop()
        result["Street_Type"] = STREET_TYPES[street_type_token]

    result["Street_Name"] = " ".join(tokens).title()

    return result


def has_value(value):
    return value is not None and str(value).strip() != ""

def is_no_street_type_required(row):
    street_name = str(row.get("Street_Name", "")).upper().strip()

    no_type_keywords = [
        "HWY",
        "HIGHWAY",
        "ROUTE",
        "COUNTY ROAD",
        "REGIONAL ROAD",
        "CONCESSION",
        "LINE",
    ]
    return any(
        street_name.startswith(keyword) or street_name == keyword
        for keyword in no_type_keywords
    )

def evaluate_record(row):
    notes = []
    needs_review = False
    special_case = False

    has_po_box = has_value(row.get("PO_Box"))
    has_rr = has_value(row.get("Rural_Route_Number"))
    has_site = has_value(row.get("Site"))
    has_stn = has_value(row.get("STN_Name"))
    has_zip = has_value(row.get("Zip"))
    address_region = str(row.get("Address_Region", "")).strip()

    has_special_address = has_po_box or has_rr or has_site or has_stn

    if not has_value(row.get("City")):
        notes.append("Missing city")
        needs_review = True

    if not has_value(row.get("Province")):
        notes.append("Missing province/state")
        needs_review = True

    if not has_value(row.get("Postal")):
        if has_zip:
            notes.append("ZIP address detected")
        else:
            notes.append("Missing Postal Code")
            needs_review = True

    #Normal Civic addres validation
    if not has_special_address:
        if not has_value(row.get("Street_Number")):
            notes.append("Missing street number")
            needs_review = True

        if not has_value(row.get("Street_Name")):
            notes.append("Missing street name")
            needs_review = True

        if not has_value(row.get("Street_Type")):
            if is_no_street_type_required(row):
                notes.append("Street type not required for this road name")
                special_case = True
            else:
                notes.append("Street type not detected")

    if address_region == "USA":
        notes.append("USA ZIP detected")
        special_case = True
    elif address_region == "USA Missing ZIP":
        notes.append("USA address detected but ZIP is missing")
        special_case = True
    elif address_region == "USA Missing Info":
        notes.append(
            "USA address detected but ZIP or State is missing"
        )
        needs_review = True
    elif address_region == "International":
        notes.append("International address detected")
        special_case = True
    elif address_region == "No Data":
        notes.append("No country detected")
        needs_review = True


    #Special Cases, not error

    if has_po_box:
        notes.append("PO Box address")
        special_case = True

    if has_rr:
        notes.append("Rural Route address")
        special_case = True

    if has_site:
        notes.append("Site address")
        special_case = True

    if has_stn:
        notes.append("Station/RPO address")
        special_case = True

    selection_status = str(row.get("Selection_Status", "")).strip()

    if selection_status == "ALT_REVIEW":
        notes.append("Alternate address involved")
        special_case = True

    if selection_status == "MANUAL_REVIEW":
        notes.append("Manual review required from address selection")
        needs_review = True

    if needs_review:
        status = "Needs Review"
        confidence = 50
    elif special_case:
        status = "Special Case"
        confidence = 85
    else:
        status = "Ready"
        confidence = 100
    return status, "; ".join(notes), confidence


def classify_address_region(row):
    postal = str(row.get("Selected_Postal", "")).upper().strip()
    province = str(row.get("Province", "")).upper().strip()
    zip_code = str(row.get("Zip", "")).strip()

    street = row.get("Street_Address", "")
    city = row.get("City", "")

    clean_postal = re.sub(r"[\s-]", "", postal)

    canada_postal_match = re.fullmatch(
        r"[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]\d[ABCEGHJ-NPRSTVWXYZ]\d",
        clean_postal
    )
    if canada_postal_match and province in CANADIAN_PROVINCES:
        return "Canada Confirmed"

    usa_zip_match = re.fullmatch(
        r"\d{5}(?:-\d{4})?",
        zip_code
    )

    if province in USA_STATES and usa_zip_match:
        return "USA"

    if province in USA_STATES or usa_zip_match:
        return "USA Missing Info"

    if any([
        has_value(street),
        has_value(city),
        has_value(postal)
    ]):
        return "International"
    return "No Data"


def classify_address(address):
    if address is None:
        return "UNKNOWN"

    address = str(address).upper().strip()

    #PO Box
    if re.search(r"PO\s*BOX", address):
        return "PO_BOX"

    #Rural Route
    if re.search(r"\bRR\b\s*#?\s*\d+", address):
        return "RURAL_ROUTE"

    #Lot/Site
    if re.search(r"\bLOT\b", address):
        return "LOT_SITE"

    return "NORMAL"


def review_batch(batch_json):
    results = []
    for _, street, city, region, postal in json.loads(batch_json):
        parsed = parse_street(street)
        region = region.upper()
        province = DEMO_PROVINCES.get(region, region)
        postal = postal.upper()
        zip_code = postal if re.fullmatch(r"\d{5}(?:-\d{4})?", postal) else ""
        record = {
            **parsed,
            "Street_Address": street,
            "City": city,
            "Province": province,
            "Selected_Postal": postal,
            "Postal": "" if zip_code else postal,
            "Zip": zip_code,
        }
        demo_format = region in DEMO_PROVINCES and re.fullmatch(r"DEMO-\d{3}", postal)
        record["Address_Region"] = "Canada Confirmed" if demo_format else classify_address_region(record)
        status, notes, _ = evaluate_record(record)
        kind = classify_address(street).replace("_", " ").title()
        unit = " ".join(filter(None, (parsed["Unit_Type"], parsed["Unit_Number"])))
        civic = " ".join(filter(None, (parsed["Street_Number"], parsed["Street_Name"],
                                        parsed["Street_Type"], parsed["Street_Direction"])))
        normalized = ", ".join(filter(None, (unit, civic)))
        if parsed["PO_Box"]:
            normalized = f'PO Box {parsed["PO_Box"]}'
            if parsed["STN_Name"]:
                normalized += f' · {parsed["STN_Name"]}'
        elif parsed["Rural_Route_Number"]:
            normalized = " · ".join(filter(None, (normalized, f'RR {parsed["Rural_Route_Number"]}')))
        region_label = "Canada (format)" if record["Address_Region"] == "Canada Confirmed" else record["Address_Region"]
        results.append({"status": status, "notes": notes, "normalized": normalized,
                        "kind": kind, "region": region_label})
    return json.dumps(results)
