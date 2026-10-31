// Meraki topic set (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
// ---------- 3.1 Day 0 (7) ----------
{g:3,t:"3.1",y:"o",p:"Put the Day-0 steps for a new branch's Meraki gear in order.",
s:["Claim the serials into the new network","Claim the order into the organization's inventory","Create the network with the product types the branch needs","The devices come online and download the network's configuration"],
o:["2, 3, 1, 4","3, 2, 1, 4","2, 1, 3, 4","2, 3, 4, 1"],
e:"Devices must be in inventory before they can be added to a network, and the network must exist first. Devices only download a configuration once they belong to a network."},

{g:3,t:"3.1",p:"Which request adds every device and license on order 4CXXXXXXX to the organization's inventory?",
o:["POST /organizations/{organizationId}/claim with {\"orders\": [\"4CXXXXXXX\"]}","POST /networks/{networkId}/devices/claim with {\"orders\": [\"4CXXXXXXX\"]}","PUT /organizations/{organizationId}/inventory/devices with {\"orders\": [\"4CXXXXXXX\"]}","POST /organizations/{organizationId}/claim with {\"orderNumber\": \"4CXXXXXXX\"}"],
e:"The organization claim takes orders, serials or licenses as arrays. Network claims only accept serials of devices already in inventory, and there's no PUT on inventory."},

{g:3,t:"3.1",p:"A branch must stop following its configuration template but keep the settings it has now. Which request does that?",
o:["POST /networks/{networkId}/unbind with {\"retainConfigs\": true}","POST /networks/{networkId}/unbind with {\"retainConfigs\": false}","DELETE /networks/{networkId}/bind","PUT /networks/{networkId} with {\"configTemplateId\": null}"],
e:"unbind detaches the network, and retainConfigs: true copies the template's settings into it. Without that, the network loses the template-provided configuration."},

{g:3,t:"3.1",p:"New switches should appear on the Dashboard map at their site's street address. Which call sets that?",
o:["PUT /devices/{serial} with address set and moveMapMarker: true","PUT /networks/{networkId} with address set, which every device inherits","PUT /devices/{serial} with address set, which moves the map marker by default","POST /devices/{serial}/location with latitude and longitude"],
e:"Address belongs to each device. moveMapMarker: true geocodes the address and moves the marker, which otherwise stays where it was. Networks don't have an address."},

{g:3,t:"3.1",p:"claimNetworkDevices fails for a new MR, although the same call works for the site's MX and MS. The network was created with productTypes [\"appliance\", \"switch\"]. Why?",
o:["The network doesn't include the wireless product type, so it can't hold an MR","MR access points must be claimed into the organization, not a network","The MR must be claimed before the MX, because claims run in order","MRs need a configuration template bound to the network before claimNetworkDevices will accept their serials"],
e:"A network only holds the device types in its productTypes. The MR needs a network that includes wireless."},

{g:3,t:"3.1",p:"Which body for PUT /devices/{serial}/managementInterface gives an MX a static address on WAN 1 before it ships?",
o:["{\"wan1\": {\"wanEnabled\": \"enabled\", \"usingStaticIp\": true, \"staticIp\": \"203.0.113.10\", \"staticSubnetMask\": \"255.255.255.248\", \"staticGatewayIp\": \"203.0.113.9\", \"staticDns\": [\"8.8.8.8\"]}}",
"{\"wan1\": {\"wanEnabled\": \"enabled\", \"dhcp\": false, \"ip\": \"203.0.113.10\", \"mask\": \"255.255.255.248\", \"gateway\": \"203.0.113.9\", \"dns\": [\"8.8.8.8\"]}}",
"{\"wan1\": {\"wanEnabled\": \"enabled\", \"usingStaticIp\": true, \"staticIp\": \"203.0.113.10/29\", \"staticGatewayIp\": \"203.0.113.9\", \"staticDns\": \"8.8.8.8\"}}",
"{\"uplinks\": [{\"interface\": \"wan1\", \"wanEnabled\": \"enabled\", \"usingStaticIp\": true, \"staticIp\": \"203.0.113.10\", \"staticSubnetMask\": \"255.255.255.248\", \"staticGatewayIp\": \"203.0.113.9\", \"staticDns\": [\"8.8.8.8\"]}]}"],
e:"usingStaticIp switches off DHCP, the mask is its own field rather than CIDR notation, and staticDns is an array. The settings belong under wan1 or wan2."},

{g:3,t:"3.1",p:"Which body for POST /organizations/{organizationId}/networks creates a combined MX and MS network on New Zealand time?",
o:["{\"name\": \"BR-30\", \"productTypes\": [\"appliance\", \"switch\"], \"timeZone\": \"Pacific/Auckland\", \"tags\": [\"branch\"]}",
"{\"name\": \"BR-30\", \"type\": \"combined\", \"timeZone\": \"Pacific/Auckland\", \"tags\": [\"branch\"]}",
"{\"name\": \"BR-30\", \"productTypes\": \"appliance,switch\", \"timeZone\": \"Pacific/Auckland\", \"tags\": [\"branch\"]}",
"{\"name\": \"BR-30\", \"productTypes\": [\"appliance\", \"switch\"], \"timezone\": \"New Zealand Standard Time\", \"tags\": [\"branch\"]}"],
e:"productTypes is an array, and listing more than one makes a combined network. timeZone is case-sensitive and takes an IANA name."},

// ---------- 3.2 Python and the Dashboard API (13) ----------
{g:3,t:"3.2",p:"Which header authenticates a request to the Dashboard API v1?",
o:["Authorization: Bearer <API key>","X-Auth-Token: <API key>","Authorization: Basic <base64 of API key>","X-Meraki-Token: <API key>"],
e:"v1 uses a bearer token. X-Auth-Token belongs to Catalyst Center, and the API doesn't use Basic authentication."},

{g:3,t:"3.2",y:"m",p:"Which two statements about Dashboard API keys are true? (Choose two.)",
o:["A key carries the privileges of the Dashboard admin who generated it","API access must be enabled for the organization before keys work there","Each key is limited to the one network it was created in","Keys expire 24 hours after they're generated, so long-running scripts must request a new one each day","Each key has its own rate limit, separate from the organization's"],
e:"Keys belong to an admin account and inherit its access, across every organization that admin can reach. The rate limit is shared per organization, and keys don't expire on a timer."},

{g:3,t:"3.2",p:"Which expression fills the blank so the loop follows Meraki's pagination?",
c:`def all_clients(s, net_id):
    # Purpose: collect every client in a network across all pages
    url = f"https://api.meraki.com/api/v1/networks/{net_id}/clients"
    params = {"perPage": 1000, "timespan": 86400}
    items = []
    while url:
        r = s.get(url, params=params)
        r.raise_for_status()
        items += r.json()
        url = ________
        params = None
    return items`,
o:["r.links.get(\"next\", {}).get(\"url\")","r.json().get(\"next\")","r.headers.get(\"X-Next-Page\")","url + \"&page=2\""],
e:"Meraki returns the next page's URL in the Link header with rel=next, and requests parses it into r.links. The next URL already holds the query parameters, which is why params is cleared."},

{g:3,t:"3.2",p:"An action batch is created with this body. What happens?",
c:`POST /organizations/{organizationId}/actionBatches
{
  "confirmed": false,
  "synchronous": false,
  "actions": [
    {"resource": "/devices/Q2XX-AAAA-0001/switch/ports/12",
     "operation": "update",
     "body": {"vlan": 30}}
  ]
}`,
o:["The batch is stored but doesn't run until it's updated with confirmed: true","The batch runs straight away, and confirmed only controls whether a result is returned","The batch is validated and then discarded, as a dry run","The request is rejected, because confirmed must be true"],
e:"Unconfirmed batches wait, which lets a script stage changes and confirm them later with PUT, or delete them. confirmed: true runs the batch on submission."},

{g:3,t:"3.2",p:"A synchronous action batch with 50 actions is rejected. What's the fix?",
o:["Make it asynchronous, which allows up to 100 actions, or split it into batches of 20","Send it twice, because synchronous batches only fail on the first try","Lower the actions to 50 per minute with a delay between them","Set confirmed: false, which raises the action limit"],
e:"Synchronous batches are limited to 20 actions so they can return results right away. Asynchronous batches allow up to 100 and are checked by polling the batch."},

{g:3,t:"3.2",p:"Which action fills the blank to change port 12 on switch Q2XX-AAAA-0001 to VLAN 30?",
c:`"actions": [ ________ ]`,
o:["{\"resource\": \"/devices/Q2XX-AAAA-0001/switch/ports/12\", \"operation\": \"update\", \"body\": {\"vlan\": 30}}",
"{\"resource\": \"/devices/Q2XX-AAAA-0001/switch/ports/12\", \"method\": \"PUT\", \"body\": {\"vlan\": 30}}",
"{\"resource\": \"https://api.meraki.com/api/v1/devices/Q2XX-AAAA-0001/switch/ports/12\", \"operation\": \"update\", \"body\": {\"vlan\": 30}}",
"{\"resource\": \"/devices/Q2XX-AAAA-0001/switch/ports/12\", \"operation\": \"PUT\", \"payload\": {\"vlan\": 30}}"],
e:"Each action names a resource path relative to /api/v1, an operation such as create, update or destroy, and a body. HTTP methods and full URLs aren't used."},

{g:3,t:"3.2",p:"Why would a script use meraki.aio.AsyncDashboardAPI instead of DashboardAPI?",
o:["To run many API calls concurrently with asyncio, while the SDK still handles 429 retries","To avoid the organization's rate limit, which doesn't apply to asynchronous calls","To use a separate, faster set of endpoints under /api/v1/async that only the async client can reach","To queue changes so that they run as an action batch automatically"],
e:"The async client suits large collection jobs, such as gathering data from hundreds of networks. The same endpoints and rate limit apply."},

{g:3,t:"3.2",p:"GET /networks/{networkId}/clients?timespan=5184000 (60 days) returns 400. Why?",
o:["The clients endpoint allows a timespan of at most 31 days","timespan must be given in milliseconds, not seconds, for this endpoint","timespan can't be combined with perPage in the same request","The clients endpoint only reports clients that are online now"],
e:"Client data is limited to a 31-day window, so timespan can be at most 2678400 seconds. Meraki API timespans are in seconds."},

{g:3,t:"3.2",p:"POST /networks/{networkId}/appliance/vlans returns 400 with an error that VLANs aren't enabled. What must happen first?",
o:["PUT /networks/{networkId}/appliance/vlans/settings with {\"vlansEnabled\": true}","PUT /networks/{networkId} with {\"vlansEnabled\": true}","POST /networks/{networkId}/appliance/vlans with VLAN 1 before any other VLAN","PUT /devices/{serial}/appliance/vlans with {\"enabled\": true} on the MX itself, before the network's VLANs can be created"],
e:"An MX network starts in single-LAN mode. Turning on VLANs in the appliance VLAN settings lets you create VLANs."},

{g:3,t:"3.2",y:"x",p:"Match each endpoint with the Python SDK scope that holds its method.",
s:["GET /networks/{networkId}/appliance/vlans","PUT /devices/{serial}/switch/ports/{portId}","GET /networks/{networkId}/wireless/ssids","GET /organizations/{organizationId}/devices/statuses"],
r:["dashboard.organizations","dashboard.wireless","dashboard.switch","dashboard.appliance"],
o:["1-d, 2-c, 3-b, 4-a","1-a, 2-c, 3-b, 4-d","1-d, 2-b, 3-c, 4-a","1-d, 2-c, 3-a, 4-b"],
e:"SDK scopes follow the product in the path (appliance, switch, wireless), with organizations, networks and devices for general endpoints. That's why the method is getNetworkApplianceVlans under appliance."},

{g:3,t:"3.2",p:"What happens if no network is named BR-99?",
c:`nets = dashboard.organizations.getOrganizationNetworks(org_id, total_pages="all")
net_id = next(n["id"] for n in nets if n["name"] == "BR-99")`,
o:["next raises StopIteration, because the generator is empty and no default was given","net_id is set to None","net_id is set to an empty string","The SDK raises APIError with status 404"],
e:"next() without a default raises StopIteration when nothing matches. Write next((...), None) and check the result. The API call itself succeeded."},

{g:3,t:"3.2",p:"A script has only an API key. How does it find the organization ID to use?",
o:["GET /organizations, which lists the organizations the key's admin can access","GET /organizations/me, which returns the organization the key was created in","Decode the API key, which embeds the ID of the organization where the admin generated it","GET /networks, which returns every network the key can reach with its organization ID"],
e:"Keys aren't tied to one organization, so the script lists the organizations it can reach and picks one by name or ID. There's no /networks collection at the top level."},

{g:3,t:"3.2",p:"Which body for PUT /networks/{networkId}/wireless/ssids/2 creates a WPA2 personal SSID?",
o:["{\"name\": \"Staff\", \"enabled\": true, \"authMode\": \"psk\", \"encryptionMode\": \"wpa\", \"wpaEncryptionMode\": \"WPA2 only\", \"psk\": \"<passphrase>\"}",
"{\"name\": \"Staff\", \"enabled\": true, \"authMode\": \"wpa2-psk\", \"psk\": \"<passphrase>\"}",
"{\"name\": \"Staff\", \"enabled\": true, \"authMode\": \"psk\", \"encryptionMode\": \"wpa2\", \"psk\": \"<passphrase>\"}",
"{\"name\": \"Staff\", \"enabled\": true, \"authMode\": \"open\", \"encryptionMode\": \"wpa\", \"wpaEncryptionMode\": \"WPA2 only\", \"psk\": \"<passphrase>\"}"],
e:"authMode psk selects a pre-shared key, encryptionMode is wep or wpa, and wpaEncryptionMode picks the WPA version. SSIDs are addressed by number (0 to 14)."},

// ---------- 3.3 Jinja2 for Meraki payloads (2) ----------
{g:3,t:"3.3",p:"This template builds a firewall request body, and the Dashboard returns 400 because the body isn't valid JSON. What's the fix?",
c:`{# rules = [{"policy": "deny", "protocol": "any",
              "srcCidr": "10.20.0.0/16", "destCidr": "10.30.0.0/16"}] #}
{"rules": {{ rules }}}`,
o:["Render it with {{ rules | tojson }}, so the list is written as JSON","Render it with {{ rules | string }}, so the list becomes text","Render it with {{ rules | join(\",\") }}, so the rules are comma-separated","Wrap the expression in quotes, as \"{{ rules }}\""],
e:"Printing a Python list gives single quotes, which JSON doesn't allow. tojson serializes it properly. Quoting would turn the list into a string."},

{g:3,t:"3.3",p:"This template builds the actions for an action batch. Why does the Dashboard reject the body?",
c:`"actions": [
{% for p in ports %}
  {"resource": "/devices/{{ serial }}/switch/ports/{{ p }}",
   "operation": "update", "body": {"vlan": 30}},
{% endfor %}
]`,
o:["The last action ends with a comma, which JSON doesn't allow; use {{ \",\" if not loop.last }}","The resource paths need the full https://api.meraki.com/api/v1 URL when they're built inside a template","Jinja2 can't run inside a JSON document","Each action needs its own actions key"],
e:"JSON forbids trailing commas, so the separator must be left off after the last item. Building the list in Python and using tojson avoids the problem altogether."},

// ---------- 3.4 Ansible (6) ----------
{g:3,t:"3.4",y:"m",p:"Which two statements about the cisco.meraki Ansible collection are true? (Choose two.)",
o:["Its modules run on the control node and call the Dashboard API","It needs the meraki Python SDK installed on the control node","Its modules connect to each Meraki device over SSH","It needs connection: network_cli for each Meraki device","Its modules run on the access points and forward calls to the Dashboard"],
e:"Meraki devices are managed only through the cloud, so tasks run locally against the API, through the SDK."},

{g:3,t:"3.4",p:"Which kind of cisco.meraki module returns data without changing anything?",
o:["The _info modules, such as networks_wireless_ssids_info","Any module run with state: present and no changed values","Any module run with state: absent while Ansible is in check mode","The organizations_action_batches module with confirmed: false"],
e:"The info modules map to GET operations and only read. state: present creates or updates."},

{g:3,t:"3.4",p:"Which expression gets BR-21's ID from this registered result?",
c:`- name: List the organization's networks
  cisco.meraki.networks_info:
    meraki_api_key: "{{ vault_meraki_key }}"
    organizationId: "{{ org_id }}"
  register: nets
# nets.meraki_response is a list of dicts with keys id, name, productTypes and tags`,
o:["{{ (nets.meraki_response | selectattr(\"name\", \"equalto\", \"BR-21\") | first).id }}","{{ nets.meraki_response[\"BR-21\"].id }}","{{ nets.meraki_response | map(attribute=\"id\") | select(\"equalto\", \"BR-21\") | first }}","{{ nets | selectattr(\"name\", \"equalto\", \"BR-21\") | first }}"],
e:"selectattr filters the list on name, first takes the match, and .id reads its ID. Mapping to IDs first throws away the names, and the list isn't keyed by name."},

{g:3,t:"3.4",p:"A playbook must change 100 switch ports in one Dashboard transaction. Which approach fits?",
o:["One task with cisco.meraki.organizations_action_batches, listing the 100 actions","A switch port task looped 100 times with throttle: 1","A switch port task run once per switch, in parallel across all forks","An ansible.builtin.uri task looped 100 times with ignore_errors: true, so one failure doesn't stop the rest"],
e:"An action batch sends every change in one call and applies them together. Looping makes 100 calls, which uses the rate limit and can stop part-way."},

{g:3,t:"3.4",p:"How should the API key be supplied to cisco.meraki tasks in a playbook kept in Git?",
o:["From an ansible-vault encrypted variable passed as meraki_api_key, or from the MERAKI_DASHBOARD_API_KEY environment variable","In group_vars as plain text, because the repository is private, only the team can read it, and keys can be rotated later if needed","In the inventory, base64-encoded so it isn't readable","In a comment at the top of the playbook for the next operator"],
e:"Keys carry their admin's full rights, so they must never sit in plain text in source control. Vault and environment variables keep them out."},

{g:3,t:"3.4",p:"Why might each Meraki network be an inventory host, with connection: local?",
o:["So each network gets its own variables, such as net_id and VLANs, and plays can be limited by network, while calls still run on the control node","So Ansible can open an SSH session to each network's MX and push the changes there, which is faster than the API and avoids the organization rate limit","Because the cisco.meraki modules only work with hosts that have IP addresses","Because the Dashboard rate limit applies per inventory host"],
e:"Modelling networks as hosts uses Ansible's variables and --limit naturally. Every call still goes to the API from the control node, so throttling may still be needed."},

// ---------- 3.5 Security: policy, compliance and segmentation (9) ----------
{g:3,t:"3.5",p:"This PUT is sent to an MX network. What's the effective layer 3 policy afterwards?",
c:`PUT /networks/{networkId}/appliance/firewall/l3FirewallRules
{"rules": [
  {"comment": "Block guest to servers", "policy": "deny", "protocol": "any",
   "srcCidr": "10.50.0.0/24", "srcPort": "Any",
   "destCidr": "10.10.0.0/16", "destPort": "Any", "syslogEnabled": false}
]}`,
o:["The deny rule, then the default rule that allows everything else","Only the deny rule, so all other traffic is now blocked","The deny rule added to the end of the existing rules","Nothing changes until the default allow rule is also included as the last rule in the body"],
e:"PUT replaces the custom rules, and the Dashboard always keeps its default allow rule at the end. You don't send the default rule, and the earlier custom rules are gone."},

{g:3,t:"3.5",p:"Which rule blocks an entire application category, such as peer-to-peer, in l7FirewallRules?",
o:["{\"policy\": \"deny\", \"type\": \"applicationCategory\", \"value\": {\"id\": \"meraki:layer7/category/<id>\"}}","{\"policy\": \"deny\", \"type\": \"application\", \"value\": {\"id\": \"meraki:layer7/category/<id>\"}}","{\"policy\": \"deny\", \"type\": \"applicationCategory\", \"value\": \"Peer-to-peer (P2P)\"}","{\"policy\": \"block\", \"type\": \"applicationCategory\", \"value\": {\"id\": \"meraki:layer7/category/<id>\"}}"],
e:"Layer 7 rules use type applicationCategory or application, with the ID taken from the application categories endpoint, and policy deny."},

{g:3,t:"3.5",p:"Security wants *.example-bad.com blocked by every MX, whatever its category. Which setting fits?",
o:["blockedUrlPatterns in PUT /networks/{networkId}/appliance/contentFiltering","blockedUrlCategories in PUT /networks/{networkId}/appliance/contentFiltering","A layer 3 firewall rule with destCidr set to example-bad.com","A traffic shaping rule that limits example-bad.com to 0 Kbps"],
e:"Content filtering blocks specific URL patterns as well as categories. Layer 3 rules match addresses and ports, and shaping limits bandwidth rather than blocking."},

{g:3,t:"3.5",p:"Which Meraki feature applies SGT-based micro-segmentation across MS, MR and MX, configured under /organizations/{organizationId}/adaptivePolicy?",
o:["Adaptive Policy, with groups (SGTs), ACLs and source-to-destination policies","Group policies, assigned per client","Policy objects referenced in layer 3 firewall rules","Switch port access policies with 802.1X, which tag each client with a group that every MX and MR enforces"],
e:"Adaptive Policy carries a security group tag with traffic and enforces ACLs between groups, like Cisco TrustSec. Group policies and policy objects work per client or by address."},

{g:3,t:"3.5",y:"m",p:"An audit must show who changed configuration, and which scripts made changes through the API. Which two endpoints help? (Choose two.)",
o:["GET /organizations/{organizationId}/configurationChanges","GET /organizations/{organizationId}/apiRequests","GET /networks/{networkId}/events","GET /organizations/{organizationId}/devices/statuses","GET /organizations/{organizationId}/inventory/devices"],
e:"configurationChanges records the admin, time, page and old and new values. apiRequests records API calls with method, path, response code and user agent. Events cover device activity."},

{g:3,t:"3.5",p:"Access ports must require 802.1X. Which port settings apply an existing switch access policy?",
o:["{\"accessPolicyType\": \"Custom access policy\", \"accessPolicyNumber\": 2}","{\"accessPolicyType\": \"802.1X\", \"accessPolicyNumber\": 2, \"stickyMacAllowListLimit\": 0}","{\"accessPolicyNumber\": 2}","{\"portSecurity\": \"dot1x\", \"radiusServer\": 2}"],
e:"accessPolicyType chooses Open, Custom access policy, MAC allow list or Sticky MAC allow list. A custom policy needs the number of an access policy defined for the network."},

{g:3,t:"3.5",p:"Guest devices need a bandwidth cap and should be blocked from social media, without changing other users. Which approach fits?",
o:["Create a group policy with the limits and rules, then apply it to the guest clients, SSID or VLAN","Add a layer 7 rule and a traffic shaping limit to the network's MX, which apply only to clients on guest SSIDs","Change the network-wide traffic shaping settings","Create a second organization for guests"],
e:"Group policies bundle bandwidth limits, firewall and layer 7 rules, and apply them to chosen clients, SSIDs or VLANs, leaving everyone else on the network settings."},

{g:3,t:"3.5",p:"Traffic between sites over AutoVPN must be filtered the same way at every MX. Which setting fits?",
o:["PUT /organizations/{organizationId}/appliance/vpn/vpnFirewallRules","PUT /networks/{networkId}/appliance/firewall/l3FirewallRules on each MX","PUT /networks/{networkId}/appliance/vpn/siteToSiteVpn with a rules list","PUT /networks/{networkId}/appliance/firewall/inboundFirewallRules"],
e:"Site-to-site VPN firewall rules are set once for the organization and apply to VPN traffic on every MX. Network L3 rules apply to traffic leaving that MX's LAN."},

{g:3,t:"3.5",p:"Wireless guests must not reach anything on the local LAN, only the internet. Which setting does that?",
o:["allowLanAccess: false in the SSID's layer 3 firewall rules","A deny rule for 0.0.0.0/0 in the SSID's layer 3 firewall rules","isolationEnabled: true in the network's switch settings","A content filtering rule that blocks private addresses"],
e:"The SSID firewall's LAN access flag blocks guests from local networks. Denying 0.0.0.0/0 would block the internet as well."},

// ---------- 3.6 Troubleshooting (6) ----------
{g:3,t:"3.6",p:"Which line fills the blank so the script backs off correctly?",
c:`def get_with_retry(s, url, tries=5):
    # Purpose: GET a Meraki URL, waiting when rate limited
    for _ in range(tries):
        r = s.get(url)
        if r.status_code != 429:
            return r
        ________
    raise RuntimeError("Still rate limited")`,
o:["time.sleep(int(r.headers.get(\"Retry-After\", 1)))","time.sleep(0)","time.sleep(int(r.json()[\"retryAfter\"]))","s = requests.Session()"],
e:"Retry-After, in seconds, says how long to wait. The 429 body doesn't carry it, and retrying at once or with a new session hits the same limit."},

{g:3,t:"3.6",p:"GET /networks/{networkId}/events returns 400 for a network with MX, MS and MR. What's missing?",
o:["productType, such as productType=appliance, because the network has more than one device type","timespan, because events require a time window","perPage, because events can't be returned unpaged","deviceSerial, because the events log is only kept per device and can't be read for a whole network"],
e:"In combined networks, the events endpoint needs productType to know which product's log to return."},

{g:3,t:"3.6",p:"PUT /networks/{networkId}/wireless/ssids/1 returns 400 for a network bound to a configuration template, although the same call works elsewhere. Why?",
o:["The template controls that setting, so it must be changed in the template or the network unbound","SSID 1 is reserved for templates and can't be changed on any network","Bound networks only accept action batches, not direct calls","The API key's admin needs template permissions, which are separate from network permissions on bound networks"],
e:"Template-bound networks take most settings from the template, so direct changes are refused. Change the template, which updates every bound network, or unbind."},

{g:3,t:"3.6",p:"A script meant to change the Guest SSID changed Staff instead. It used the position of Guest in the list returned by getNetworkWirelessSsids. What went wrong?",
o:["SSIDs are addressed by their number field, not their position in a filtered list or their name","SSIDs are addressed by name, so the URL should use Guest","The list is sorted by name, so the position is always wrong","SSID numbers start at 1 rather than 0, so the script's list position must be increased by 1 before it's used"],
e:"Each SSID has a fixed number from 0 to 14. Read the number from the matching item, and use it in the URL."},

{g:3,t:"3.6",p:"A PUT returns 400. Which expression shows Meraki's explanation?",
o:["r.json()[\"errors\"]","r.headers[\"X-Error\"]","r.reason","r.json()[\"message\"]"],
e:"Meraki error bodies hold an errors array of messages. r.reason is only the generic HTTP phrase, Bad Request."},

{g:3,t:"3.6",p:"Every run of a script creates a new log file in its working directory, filling the disk on a CI runner. Which SDK setting stops that?",
o:["output_log=False, or suppress_logging=True, in DashboardAPI","wait_on_rate_limit=False in DashboardAPI","print_console=False on its own, which stops the SDK writing anything","simulate=True in DashboardAPI"],
e:"The SDK writes a log file by default. output_log=False stops the file, and suppress_logging turns logging off completely. print_console only affects screen output."},

// ---------- 4.1 Testing and validation (3) ----------
{g:4,t:"4.1",p:"After re-patching, an engineer wants to check the cabling on ports 3 and 4 of an MS through the API. Which calls do that?",
o:["POST /devices/{serial}/liveTools/cableTest with {\"ports\": [\"3\", \"4\"]}, then GET the test by its ID","GET /devices/{serial}/switch/ports/statuses?ports=3,4, which runs a cable test","POST /devices/{serial}/liveTools/ping to each port's number","PUT /devices/{serial}/switch/ports/3 with {\"cableTest\": true}"],
e:"Live tools start a test on the device and return an ID, which is then polled for the result. Port statuses show link state, not cable faults."},

{g:4,t:"4.1",p:"After an ISP change, a script must confirm which MX uplinks are active and what addresses they have, across the organization. Which call fits?",
o:["GET /organizations/{organizationId}/appliance/uplink/statuses","GET /organizations/{organizationId}/devices/statuses","GET /networks/{networkId}/appliance/vlans","GET /devices/{serial}/managementInterface for each MX in the organization"],
e:"Uplink statuses report each MX uplink's status (such as active or ready), IP, gateway and public IP. managementInterface shows the configured settings, not the live state."},

{g:4,t:"4.1",y:"m",p:"Which two ways let a team test a script that makes Dashboard changes without affecting production? (Choose two.)",
o:["Create the client with DashboardAPI(simulate=True), so write calls are logged but not sent","Run the script against a separate test organization","Set verify=False on the session, so the Dashboard treats each change as uncommitted and discards it afterwards","Set suppress_logging=True, so changes are discarded","Set wait_on_rate_limit=False, so changes are queued"],
e:"Simulate mode skips POST, PUT and DELETE calls while still running the reads, and a test organization isolates real changes. The other settings don't stop changes."},

// ---------- 4.3 Firmware (3) ----------
{g:4,t:"4.3",p:"In GET /networks/{networkId}/firmwareUpgrades, which field lists the versions that can be scheduled for a product?",
o:["products.<product>.availableVersions","products.<product>.currentVersion","products.<product>.nextUpgrade","upgradeWindow"],
e:"availableVersions gives the IDs and names you can schedule as nextUpgrade.toVersion. currentVersion is what's installed, and upgradeWindow sets the default time."},

{g:4,t:"4.3",p:"Which body for PUT /networks/{networkId}/firmwareUpgrades sets the network's default upgrade window to 2 a.m. on Sundays?",
o:["{\"upgradeWindow\": {\"dayOfWeek\": \"sun\", \"hourOfDay\": \"2:00\"}}","{\"upgradeWindow\": {\"day\": \"Sunday\", \"time\": \"02:00\"}}","{\"products\": {\"switch\": {\"upgradeWindow\": \"sun 2:00\"}}}","{\"maintenanceWindow\": \"0 2 * * 0\"}"],
e:"upgradeWindow takes dayOfWeek and hourOfDay and applies to the network's automatic upgrades. Scheduling a specific upgrade uses nextUpgrade per product."},

{g:4,t:"4.3",p:"A Meraki firmware upgrade causes trouble at one network. Which call returns its MS switches to the previous version?",
o:["POST /networks/{networkId}/firmwareUpgrades/rollbacks for the switch product","PUT /devices/{serial} with the old firmware version on each switch","DELETE /networks/{networkId}/firmwareUpgrades","POST /devices/{serial}/reboot on each switch, which reverts it to the version installed before the upgrade"],
e:"Rollbacks schedule a return to an earlier version for a product. Firmware isn't set per device, and rebooting doesn't change the version."},

// ---------- 4.4 Health monitoring (4) ----------
{g:4,t:"4.4",p:"A NOC tile needs only the organization's counts of online, offline, alerting and dormant devices, in one small call. Which endpoint fits?",
o:["GET /organizations/{organizationId}/devices/statuses/overview","GET /organizations/{organizationId}/devices/statuses?perPage=1000, then count the results in the script","GET /organizations/{organizationId}/inventory/devices","GET /organizations/{organizationId}/networks"],
e:"statuses/overview returns counts by status. statuses returns one entry per device, which is heavier when only totals are needed."},

{g:4,t:"4.4",p:"GET /organizations/{organizationId}/devices/uplinksLossAndLatency?timespan=3600 returns an error. Why?",
o:["This endpoint only allows a timespan of up to 5 minutes","timespan must be given in milliseconds","The endpoint needs a networkId as well","The endpoint only works for MR access points"],
e:"uplinksLossAndLatency reports recent samples, with a timespan of 300 seconds at most. Longer trends need to be stored by your own collector."},

{g:4,t:"4.4",p:"Users report poor Wi-Fi in one building. Which call shows how busy each access point's channels are, including interference from non-Wi-Fi sources?",
o:["GET /networks/{networkId}/networkHealth/channelUtilization","GET /networks/{networkId}/wireless/ssids","GET /organizations/{organizationId}/devices/statuses","GET /networks/{networkId}/clients, which includes each client's RSSI and channel"],
e:"Channel utilization reports total, Wi-Fi and non-Wi-Fi use per AP and band. SSIDs and statuses don't show RF load."},

{g:4,t:"4.4",p:"After a change, a script must check that uplink ports on an MS are up at 10 Gbps and without errors. Which call fits?",
o:["GET /devices/{serial}/switch/ports/statuses","GET /devices/{serial}/switch/ports","GET /networks/{networkId}/switch/settings","GET /organizations/{organizationId}/devices/statuses"],
e:"Port statuses give live status, speed, duplex, errors and traffic for each port. The ports endpoint returns configuration only."},

// ---------- 4.6 Webhooks (5) ----------
{g:4,t:"4.6",y:"o",p:"Put the steps for sending a network's Meraki alerts to a new receiver in order.",
s:["Add the webhook server as a destination in the network's alert settings","Create the webhook server with the receiver's URL and a shared secret","An alert fires, and Meraki POSTs the payload to the receiver","Stand up the HTTPS receiver, which checks the shared secret"],
o:["4, 2, 1, 3","2, 4, 1, 3","4, 1, 2, 3","4, 2, 3, 1"],
e:"The receiver must be ready to answer before the Dashboard is pointed at it, alert settings can only reference a webhook server that exists, and alerts only flow once they're routed."},

{g:4,t:"4.6",p:"Which body for PUT /networks/{networkId}/alerts/settings sends every enabled alert to webhook server aHR0cHM6Ly9leGFtcGxl?",
o:["{\"defaultDestinations\": {\"httpServerIds\": [\"aHR0cHM6Ly9leGFtcGxl\"]}}","{\"defaultDestinations\": {\"webhooks\": [\"https://receiver.example.com/meraki\"]}}","{\"alerts\": [{\"httpServerId\": \"aHR0cHM6Ly9leGFtcGxl\"}]}","{\"httpServers\": [{\"id\": \"aHR0cHM6Ly9leGFtcGxl\", \"enabled\": true}]}"],
e:"defaultDestinations applies to every alert that doesn't set its own destinations, and webhook servers are referenced by ID. Individual alerts can override it with alertDestinations."},

{g:4,t:"4.6",y:"m",p:"Which two fields are included in every Meraki webhook payload? (Choose two.)",
o:["sharedSecret","alertType","apiKey","adminPassword","runningConfig"],
e:"Payloads carry the shared secret, so the receiver can check the sender, plus alert details such as alertType, alertTypeId, networkId and occurredAt. Credentials and full configurations are never included."},

{g:4,t:"4.6",p:"Alerts must appear in a Webex space, with no custom receiver in between. What's the simplest approach?",
o:["Create a webhook server with the Webex incoming webhook URL and the built-in Webex payload template","Write and host a receiver that rewrites each alert into Webex's message format, then posts it to the space's webhook","Set the Webex space's email address as an alert email recipient","Point the syslog server setting at Webex"],
e:"Built-in payload templates, written in Liquid, format alerts for services such as Webex, Slack and Teams, so the Dashboard posts directly to them."},

{g:4,t:"4.6",p:"Before relying on a new receiver, a team wants to send it a sample alert from the API and check it was delivered. Which calls do that?",
o:["POST /networks/{networkId}/webhooks/webhookTests, then GET the test by its ID","POST /networks/{networkId}/alerts/settings/test with the receiver URL and the alert type to simulate","GET /networks/{networkId}/webhooks/httpServers/{id}/ping","POST /organizations/{organizationId}/webhooks/send with a payload"],
e:"webhookTests sends a sample payload to a URL, optionally with a template, and its status shows whether the delivery succeeded."},

// ---------- 5.x AI (2) ----------
{g:5,t:"5.3",p:"An AI coding assistant helped write a Meraki script, and the API key ended up committed to a shared Git repository. What's the right first step?",
o:["Revoke the key and generate a new one for that admin, then remove it from the repository history","Make the repository private, which makes the key safe again","Delete the file in a new commit and push it, which removes the key from the repository and its history for everyone who clones it","Leave it, because keys only work from the IP that created them"],
e:"Anyone who saw the key has its admin's rights until it's revoked. A new commit doesn't remove the key from history, and keys aren't bound to an IP."},

{g:5,t:"5.4",p:"A FastMCP server gives an agent read-only Meraki device status. Where should its API key come from?",
o:["From the server's environment or a secret store, never from a tool argument","From a tool argument, so the model can choose which key to use","From the tool's docstring, so the model knows what to send","From the prompt, pasted in by the user at the start of each chat so it's never stored on the server"],
e:"Anything in tool arguments, prompts or descriptions passes through the model and its logs. The server should hold a least-privilege key, such as a read-only admin's, and use it itself."}
];
