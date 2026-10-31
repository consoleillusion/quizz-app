// Fill-in-the-gap questions for the Meraki set; each replaces the question whose prompt starts with "replaces".
module.exports = [
{replaces:"Which expression fills the blank so the loop follows Meraki's pagination?",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so the loop collects every page of clients.",
c:`def all_clients(s, net_id):
    # Purpose: collect every client in a network across all pages
    url = f"https://api.meraki.com/api/v1/networks/{net_id}/clients"
    params = {"⟦1⟧": 1000, "timespan": 86400}
    items = []
    while url:
        r = s.get(url, params=params)
        r.raise_for_status()
        items += r.json()
        url = r.⟦2⟧.get("⟦3⟧", {}).get("url")
        params = None
    return items`,
bank:["perPage","pageSize","limit","links","headers","next","prev","last"],
a:["perPage","links","next"],
e:"perPage sets the page size. requests parses the Link header into r.links, and the rel=next entry holds the next page's full URL, so the loop ends when there's no next link."}},

{replaces:"Which action fills the blank to change port 12",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so this action batch runs as soon as it's submitted, returns without waiting for the results, and moves port 12 to VLAN 30.",
c:`POST /organizations/{organizationId}/actionBatches
{
  "confirmed": ⟦1⟧,
  "synchronous": ⟦2⟧,
  "actions": [
    {"resource": "⟦3⟧",
     "operation": "⟦4⟧",
     "body": {"vlan": 30}}
  ]
}`,
bank:["true","false","/devices/Q2XX-AAAA-0001/switch/ports/12","https://api.meraki.com/api/v1/devices/Q2XX-AAAA-0001/switch/ports/12","update","create","PUT"],
a:["true","false","/devices/Q2XX-AAAA-0001/switch/ports/12","update"],
e:"confirmed: true runs the batch on submission, and synchronous: false returns at once so the batch is checked later. Resources are paths relative to /api/v1, and operations are create, update or destroy, not HTTP methods."}},

{replaces:"Which line fills the blank so the script backs off correctly?",
q:{g:3,t:"3.6",y:"g",p:"Fill the gaps so the function waits for as long as Meraki asks when it's rate limited.",
c:`def get_with_retry(s, url, tries=5):
    # Purpose: GET a Meraki URL, waiting when rate limited
    for _ in range(tries):
        r = s.get(url)
        if r.status_code != ⟦1⟧:
            return r
        time.sleep(int(r.headers.get("⟦2⟧", 1)))
    raise RuntimeError("Still rate limited")`,
bank:["429","503","401","Retry-After","X-RateLimit-Reset","Link"],
a:["429","Retry-After"],
e:"Meraki signals rate limiting with 429 and gives the wait, in seconds, in the Retry-After header."}},

{replaces:"Which body for PUT /networks/{networkId}/wireless/ssids/2 creates a WPA2 personal SSID?",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so SSID 2 becomes a WPA2 personal (pre-shared key) network.",
c:`PUT /networks/{networkId}/wireless/ssids/2
{
  "name": "Staff",
  "enabled": true,
  "authMode": "⟦1⟧",
  "encryptionMode": "⟦2⟧",
  "wpaEncryptionMode": "⟦3⟧",
  "psk": "<passphrase>"
}`,
bank:["psk","open","8021x-radius","wpa","wep","wpa2","WPA2 only","WPA3 only"],
a:["psk","wpa","WPA2 only"],
e:"authMode psk selects a pre-shared key, encryptionMode is wep or wpa, and wpaEncryptionMode picks the WPA version. There's no wpa2 value for encryptionMode."}},

{replaces:"Which body for PUT /devices/{serial}/managementInterface gives an MX a static address",
q:{g:3,t:"3.1",y:"g",p:"Fill the gaps so the MX uses a static address on its first WAN uplink before it ships.",
c:`PUT /devices/{serial}/managementInterface
{
  "⟦1⟧": {
    "wanEnabled": "enabled",
    "⟦2⟧": true,
    "staticIp": "203.0.113.10",
    "staticSubnetMask": "⟦3⟧",
    "staticGatewayIp": "203.0.113.9",
    "staticDns": ⟦4⟧
  }
}`,
bank:["wan1","wan2","uplinks","usingStaticIp","dhcp","255.255.255.248","/29","[\"8.8.8.8\"]","\"8.8.8.8\""],
a:["wan1","usingStaticIp","255.255.255.248","[\"8.8.8.8\"]"],
e:"Settings sit under wan1 or wan2. usingStaticIp turns off DHCP, the mask is written out in full rather than as a prefix, and staticDns is an array."}},

{replaces:"Which body for PUT /networks/{networkId}/alerts/settings sends every enabled alert",
q:{g:4,t:"4.6",y:"g",p:"Fill the gaps so every enabled alert goes to webhook server aHR0cHM6Ly9leGFtcGxl, unless an alert sets its own destinations.",
c:`PUT /networks/{networkId}/alerts/settings
{
  "⟦1⟧": {
    "emails": [],
    "⟦2⟧": ["aHR0cHM6Ly9leGFtcGxl"]
  }
}`,
bank:["defaultDestinations","alertDestinations","alerts","httpServerIds","webhooks","httpServers"],
a:["defaultDestinations","httpServerIds"],
e:"defaultDestinations applies to every alert without its own alertDestinations, and webhook servers are referenced by their IDs in httpServerIds."}},

{replaces:"Which expression gets BR-21's ID from this registered result?",
q:{g:3,t:"3.4",y:"g",p:"Fill the gaps so br21_id holds the ID of the network named BR-21.",
c:`- name: List the organization's networks
  cisco.meraki.networks_info:
    meraki_api_key: "{{ vault_meraki_key }}"
    organizationId: "{{ org_id }}"
  register: nets
# nets.meraki_response is a list of dicts with keys id, name, productTypes and tags

- ansible.builtin.set_fact:
    br21_id: "{{ (nets.meraki_response | ⟦1⟧('name', 'equalto', 'BR-21') | ⟦2⟧).⟦3⟧ }}"`,
bank:["selectattr","select","map","first","last","list","id","name"],
a:["selectattr","first","id"],
e:"selectattr filters a list of dicts on an attribute, first takes the single match, and .id reads its ID. select tests the items themselves, not one of their attributes."}}
];
