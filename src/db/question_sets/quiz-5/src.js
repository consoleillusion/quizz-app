// Questions for practice quiz 5 (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
{g:1,t:"1.1",p:"An interface description is changed on IOS XE through NETCONF using openconfig-interfaces. Where does the change appear?",
o:["In the running configuration as native CLI, because IOS XE translates OpenConfig into its own configuration",
"Only in a separate OpenConfig datastore that sits beside running, so show running-config doesn't include it",
"In the running configuration, but it's lost at reload unless it's also saved through OpenConfig",
"In the candidate datastore only, until an OpenConfig-specific commit RPC applies it"],
e:"IOS XE keeps one configuration. OpenConfig and IETF edits are mapped onto it, so they show in show running-config and are saved like any other change."},

{g:1,t:"1.2",y:"x",p:"Match each NETCONF operation with what it does.",
s:["get-config","get","discard-changes","commit"],
r:["Copies the candidate configuration into running","Returns configuration and operational state","Resets the candidate to match running","Returns configuration data only"],
o:["1-d, 2-b, 3-c, 4-a","1-b, 2-d, 3-c, 4-a","1-d, 2-b, 3-a, 4-c","1-d, 2-c, 3-b, 4-a"],
e:"get-config reads a datastore's configuration, get adds state data, discard-changes throws away uncommitted candidate edits, and commit applies the candidate to running."},

{g:1,t:"1.3",p:"Which JSON body is valid for PUT /restconf/data/example-qos:shaper?",
c:`module: example-qos
  +--rw shaper
     +--rw rate     uint64
     +--rw burst?   uint32
     +--rw ratio?   decimal64`,
o:["{\"example-qos:shaper\": {\"rate\": \"10000000000\", \"burst\": 1500, \"ratio\": \"0.75\"}}",
"{\"example-qos:shaper\": {\"rate\": 10000000000, \"burst\": 1500, \"ratio\": 0.75}}",
"{\"example-qos:shaper\": {\"rate\": \"10000000000\", \"burst\": \"1500\", \"ratio\": \"0.75\"}}",
"{\"example-qos:shaper\": {\"rate\": 10000000000, \"burst\": 1500, \"ratio\": \"0.75\"}}"],
e:"RFC 7951 encodes int64, uint64 and decimal64 as JSON strings, because many JSON parsers lose precision on large numbers. Smaller integer types, such as uint32, are JSON numbers."},

{g:1,t:"1.4",p:"Which XML sets the interface type to the softwareLoopback identity from iana-if-type?",
c:`module: ietf-interfaces
  +--rw interfaces
     +--rw interface* [name]
        +--rw name    string
        +--rw type    identityref

iana-if-type namespace: urn:ietf:params:xml:ns:yang:iana-if-type`,
o:["<type xmlns:ianaift=\"urn:ietf:params:xml:ns:yang:iana-if-type\">ianaift:softwareLoopback</type>",
"<type xmlns:ianaift=\"urn:ietf:params:xml:ns:yang:ietf-interfaces\">ianaift:softwareLoopback</type>",
"<type xmlns=\"urn:ietf:params:xml:ns:yang:iana-if-type\">softwareLoopback</type>",
"<type>softwareLoopback</type>"],
e:"In XML, an identityref value is a qualified name whose prefix must be declared in scope. Using the module name as an undeclared prefix doesn't work, and a default xmlns would move the type element itself into the wrong namespace."},

{g:1,t:"1.5",p:"Which RESTCONF URL reads the poe container for GigabitEthernet1/0/5?",
c:`module: example-poe

  augment /if:interfaces/if:interface:
    +--rw poe
       +--rw enabled?       boolean
       +--rw max-power?     uint16
       +--ro power-drawn?   uint16`,
o:["/restconf/data/ietf-interfaces:interfaces/interface=GigabitEthernet1%2F0%2F5/example-poe:poe",
"/restconf/data/ietf-interfaces:interfaces/interface=GigabitEthernet1%2F0%2F5/poe",
"/restconf/data/example-poe:poe/interface=GigabitEthernet1%2F0%2F5",
"/restconf/data/ietf-interfaces:interfaces/interface=GigabitEthernet1%2F0%2F5/example-poe:interface/poe"],
e:"Augmented nodes live under the target path but belong to the augmenting module, so the path segment is module-qualified where the namespace changes. The augment doesn't create a new top-level tree."},

{g:1,t:"1.5",y:"m",p:"Which two statements about this tree are true? (Choose two.)",
c:`module: example-auth
  +--rw servers
     +--rw server* [name]
        +--rw name           string
        +--rw (transport)
        |  +--:(udp)
        |  |  +--rw udp-port?   inet:port-number
        |  +--:(tls)
        |     +--rw tls-port?   inet:port-number
        |     +--rw ca-cert     string
        +--rw timeout?       uint8`,
o:["Each server must use exactly one of the two cases, because the choice has no ? marker","When the tls case is used, ca-cert must be set","A server can set udp-port and tls-port at the same time","The URL path to udp-port includes /transport/udp/","timeout must be set, because every non-key leaf is mandatory"],
e:"A choice without ? is mandatory, and its cases exclude each other. A leaf without ? inside a case is mandatory when that case is chosen. Choice and case names never appear in paths or payloads."},

{g:2,t:"2.1",p:"The image is already on the switch's flash with a matching MD5. What does file_transfer return?",
c:`from netmiko import ConnectHandler, file_transfer

with ConnectHandler(**dev) as conn:
    result = file_transfer(conn,
                           source_file="cat9k_iosxe.17.12.04.SPA.bin",
                           dest_file="cat9k_iosxe.17.12.04.SPA.bin",
                           file_system="flash:", direction="put",
                           overwrite_file=False)
print(result)`,
o:["{'file_exists': True, 'file_transferred': False, 'file_verified': True}","{'file_exists': True, 'file_transferred': True, 'file_verified': True}","{'file_exists': False, 'file_transferred': False, 'file_verified': False}","It raises an exception, because overwrite_file=False forbids an existing file"],
e:"file_transfer checks for the file and its MD5 first and skips the copy when they match, reporting that nothing was transferred but the file is verified. It uses SCP, so the switch needs ip scp server enable."},

{g:2,t:"2.1",p:"Which send_command option returns structured data from a pyATS Genie parser, rather than from an ntc-templates template?",
o:["use_genie=True","use_textfsm=True","use_ttp=True with no template","strip_prompt=False"],
e:"use_genie uses Genie's parsers when pyATS and Genie are installed, and returns the raw string if no parser matches. use_textfsm uses ntc-templates, and use_ttp needs a TTP template."},

{g:2,t:"2.2",p:"A team wants to inspect Cisco-IOS-XE-interfaces-oper with pyang, using the exact revision on the device. Which ncclient call retrieves it?",
o:["m.get_schema(\"Cisco-IOS-XE-interfaces-oper\")","m.get(filter=(\"subtree\", \"<Cisco-IOS-XE-interfaces-oper/>\"))","m.get_config(source=\"running\", filter=(\"xpath\", \"/interfaces-ios-xe-oper:*\"))","m.server_capabilities[\"Cisco-IOS-XE-interfaces-oper\"]"],
e:"get-schema, from ietf-netconf-monitoring, returns the YANG text of a module the device supports. Capabilities only list module names and revisions, and get or get-config return data, not schemas."},

{g:2,t:"2.2",p:"Which ncclient call saves the running configuration to startup on IOS XE?",
o:["m.dispatch(to_ele('<save-config xmlns=\"http://cisco.com/yang/cisco-ia\"/>'))","m.copy_config(source=\"running\", target=\"startup\"), which IOS XE maps to write memory","m.commit()","m.edit_config(target=\"startup\", config=running_cfg)"],
e:"IOS XE doesn't expose a startup datastore over NETCONF, so copy-config and edit-config to startup fail. The cisco-ia save-config RPC performs the save, and commit only applies candidate to running."},

{g:2,t:"2.3",p:"A GET on an interface doesn't show mtu, which is still at its YANG default of 1500. Which query includes default values in the reply?",
o:["?with-defaults=report-all","?with-defaults=trim&content=all","?depth=unbounded","?fields=mtu"],
e:"Servers usually leave out leaves that hold their default. with-defaults=report-all includes them. content=all and depth=unbounded are already the defaults, and fields can't return a value the server doesn't report."},

{g:2,t:"2.3",p:"Which expression returns the list of GigabitEthernet entries?",
c:`r = requests.get(f"{base}/data/Cisco-IOS-XE-native:native/interface",
                 auth=auth, verify="corp-ca.pem",
                 headers={"Accept": "application/yang-data+json"})
gig = ________`,
o:["r.json()[\"Cisco-IOS-XE-native:interface\"][\"GigabitEthernet\"]","r.json()[\"Cisco-IOS-XE-native:interface\"][\"Cisco-IOS-XE-native:GigabitEthernet\"]","r.json()[\"Cisco-IOS-XE-native:native\"][\"interface\"][\"GigabitEthernet\"]","r.json()[\"interface\"][\"GigabitEthernet\"]"],
e:"The top-level member is the requested node, qualified with its module. Children in the same module aren't prefixed, and the parent native container isn't included."},

{g:2,t:"2.3",p:"in-octets for an interface is read twice, 60 seconds apart, giving 1,000,000 and then 8,500,000. What's the average input rate?",
c:`a = get_counter(intf)          # 1,000,000
time.sleep(60)
b = get_counter(intf)          # 8,500,000
rate = (b - a) * 8 / 60`,
o:["1,000,000 bps (1 Mbps)","125 kbps","7.5 Mbps","8 Mbps"],
e:"7,500,000 octets in 60 seconds is 125,000 bytes per second, which is 1,000,000 bits per second. The * 8 converts octets to bits."},

{g:2,t:"2.4",p:"Where does this play's data end up?",
c:`- name: Collect interface configuration
  cisco.ios.ios_facts:
    gather_subset: min
    gather_network_resources:
      - interfaces`,
o:["ansible_network_resources.interfaces, as structured resource data","ansible_net_interfaces, as operational data per interface","ansible_facts.interfaces, as the raw show interfaces text","A file named interfaces.json on the control node"],
e:"Resource facts appear under ansible_network_resources, in the same structure the resource modules accept. ansible_net_interfaces comes from the legacy interfaces gather_subset."},

{g:2,t:"2.4",p:"How does a team report drift between each switch's running configuration and its golden file, without changing anything?",
o:["Run ios_config with diff_against: intended and intended_config set to the golden file, in --check --diff mode","Run ios_config with the golden file in src and match: none, in normal mode","Run ios_config with backup: true and backup_options, then compare each backup with the golden file by hand afterwards","Run ios_command with show archive config differences, using the golden file as the argument"],
e:"diff_against: intended compares running with intended_config and shows the result when --diff is used. With --check, nothing is pushed. match: none would push every line."},

{g:2,t:"2.5",p:"In an IPv6-only provisioning network, which DHCPv6 option gives a new IOS XE switch its ZTP script URL?",
o:["Option 59","Option 67","Option 43","Option 17"],
e:"DHCPv6 option 59 (OPT_BOOTFILE_URL) carries the URL in IPv6, the counterpart of DHCPv4 option 67. Option 43 is the DHCPv4 vendor option, which PnP uses."},

{g:2,t:"2.5",y:"m",p:"Which two statements about IOS XE ZTP are true? (Choose two.)",
o:["The Python script can run CLI commands through the cli module in Guest Shell","ZTP only starts when the switch boots without a startup configuration","ZTP needs Catalyst Center to send it the Python script during onboarding","ZTP needs DHCP option 43 to find the script","ZTP scripts must be written in Tcl"],
e:"ZTP downloads a Python script named in option 67 (or option 59 for IPv6) and runs it in Guest Shell. Option 43 and Catalyst Center belong to PnP."},

{g:2,t:"2.6",p:"A RESTCONF PATCH returns this while a NETCONF script is running. What's the cause?",
c:`HTTP/1.1 409 Conflict
{
  "errors": {
    "error": [{
      "error-type": "protocol",
      "error-tag": "lock-denied",
      "error-message": "the running datastore is locked by another session"
    }]
  }
}`,
o:["The NETCONF session holds a lock on running, so RESTCONF writes wait until it's released","The interface already exists, so the PATCH must be sent as a POST to the parent list instead","The RESTCONF user lacks privilege 15 for writes to the running datastore","The body has a key that doesn't match the URL"],
e:"RESTCONF and NETCONF share the running datastore, so a NETCONF lock blocks RESTCONF changes, which return 409. Retry after the lock is released."},

{g:2,t:"2.6",y:"x",p:"Match each NETCONF error-tag with its most likely cause.",
s:["unknown-namespace","data-exists","lock-denied","access-denied"],
r:["Another session holds the lock on the datastore","The user isn't allowed to perform the operation","An xmlns value is misspelled, for example Cisco-IOS-XE-Native","operation=\"create\" was used on data that's already there"],
o:["1-c, 2-d, 3-a, 4-b","1-d, 2-c, 3-a, 4-b","1-c, 2-d, 3-b, 4-a","1-a, 2-d, 3-c, 4-b"],
e:"Namespaces are case-sensitive URIs, so a typo gives unknown-namespace. create on existing data gives data-exists, a held lock gives lock-denied, and NACM refusals give access-denied."},

{g:2,t:"2.7",p:"An administrator types reload. What happens?",
c:`event manager applet BLOCK-RELOAD
 event cli pattern "^reload" sync yes
 action 1.0 syslog msg "reload blocked by policy"
 action 2.0 set _exit_status "0"`,
o:["The applet runs first and logs the message, and the reload isn't executed","The reload runs first, and then the applet logs the message","The applet logs the message, and the reload runs once the applet finishes","The applet and the reload run at the same time, and the message is logged"],
e:"With sync yes, the applet runs before the command, and _exit_status decides its fate: 0 skips the command and 1 runs it. With sync no, the command and the applet run independently."},

{g:2,t:"2.7",p:"What does entry-type increment mean in this applet?",
c:`event manager applet CRC-RISE
 event interface name GigabitEthernet1/0/1 parameter input_errors_crc entry-op ge entry-val 100 entry-type increment poll-interval 60
 action 1.0 syslog msg "CRC errors rising on Gi1/0/1"`,
o:["It fires when the CRC counter rises by 100 or more between polls","It fires when the CRC counter's total since the last clear reaches 100 or more","It fires when the CRC counter rises by 100 or more per second","It fires 100 times, once for each poll after the first"],
e:"entry-type increment compares the change since the previous poll with entry-val, while value compares the counter itself and rate compares the change per second."},

{g:3,t:"3.1",p:"In a Catalyst Center PnP site-claim, which part of the body supplies values for the onboarding template's variables?",
o:["configInfo.configParameters, as a list of key and value pairs","configInfo.configId, as a dict that maps each variable name to its value","imageInfo.parameters, as a list of key and value pairs","siteId, with the variables added as query parameters"],
e:"configId names the template, and configParameters gives each variable as a key and value pair. imageInfo covers the image, and siteId only identifies the site."},

{g:3,t:"3.1",p:"What does autoBind=True do in this call?",
c:`dashboard.networks.bindNetwork(net_id,
                               configTemplateId=tpl_id,
                               autoBind=True)`,
o:["It binds each switch in the network to the template's switch profile for its model","It binds every network created later in the organization to this template automatically","It claims the organization's unused devices into the network as it binds","It re-binds the network whenever the template's configuration changes"],
e:"autoBind applies the template's switch profiles to switches of the matching model. Networks stay bound to the template without it, and binding never claims devices."},

{g:3,t:"3.1",p:"Attaching a device template to a new WAN edge through SD-WAN Manager fails, reporting missing values. What's needed?",
o:["Device-specific variable values in the attach request, such as system IP, site ID and hostname","A second template containing those values, attached to the edge first","A reboot of the edge, so it reports those values to SD-WAN Manager","The values in the template itself, because attach requests can't carry per-device variable values"],
e:"Templates use variables for per-device settings, and each attach must supply them, through the API body or a CSV in the GUI. The edge doesn't provide them itself."},

{g:3,t:"3.2",p:"What happens if no device has management IP 10.9.9.9?",
c:`r = requests.get(f"{base}/dna/intent/api/v1/network-device",
                 params={"managementIpAddress": "10.9.9.9"},
                 headers={"X-Auth-Token": token}, verify="ca.pem")
dev_id = r.json()["response"][0]["id"]`,
o:["The last line raises IndexError, because response is an empty list","The GET returns 404 Not Found, so r.json() raises an exception before the index","response is null, so the last line raises TypeError","dev_id is set to an empty string"],
e:"A filtered list query that matches nothing still returns 200 with an empty response list, so [0] fails. Check the list's length before indexing."},

{g:3,t:"3.2",p:"With default settings, what does the Meraki Python SDK do when the Dashboard returns 429?",
o:["It waits for the time in Retry-After and retries, up to maximum_retries","It raises APIError immediately, so the caller must retry","It retries the request straight away, in a loop, until the Dashboard accepts it","It drops the request and returns None"],
e:"wait_on_rate_limit is on by default, so the SDK sleeps for Retry-After and tries again, up to maximum_retries. After that it raises APIError."},

{g:3,t:"3.2",p:"Which expression gets the device list from GET /dataservice/device on SD-WAN Manager?",
o:["r.json()[\"data\"]","r.json()[\"response\"]","r.json()[\"devices\"]","r.json()[0]"],
e:"SD-WAN Manager replies put results in data, alongside a header with column information. response is Catalyst Center's wrapper."},

{g:3,t:"3.2",p:"After CSRF checking is turned on in ISE's ERS settings, every POST fails with 403, but GETs work. What must the script do?",
o:["Send a GET with X-CSRF-Token: fetch, then send the returned token in X-CSRF-Token on each write","Send the ERS password again in an X-CSRF-Token header on each write","Get a token from /ers/config/auth/token and send it as Authorization: Bearer on every POST, PUT and DELETE","Switch the body format from JSON to XML, which CSRF checking doesn't affect"],
e:"With CSRF enabled, ERS issues a token in response to X-CSRF-Token: fetch, and writes must carry it. Authentication itself stays Basic."},

{g:3,t:"3.3",p:"What does this render?",
c:`{% macro access_port(name, vlan=1) %}
interface {{ name }}
 switchport access vlan {{ vlan }}
{% endmacro %}
{{ access_port("Gi1/0/1", 20) }}
{{ access_port("Gi1/0/2") }}`,
o:["Gi1/0/1 in VLAN 20, and Gi1/0/2 in VLAN 1","Gi1/0/1 in VLAN 20, and Gi1/0/2 in VLAN 20","Gi1/0/1 in VLAN 20, and Gi1/0/2 with an empty VLAN","An error, because macros need every argument"],
e:"Macros take default values like Python functions. The second call leaves out vlan, so it gets the default of 1, and calls don't share values."},

{g:3,t:"3.3",p:"vlans is loaded from a CSV file, so every id is a string. What happens when this renders?",
c:`{% for v in vlans %}
{% if v.id > 50 %}
vlan {{ v.id }}
 name {{ v.name }}
{% endif %}
{% endfor %}`,
o:["Rendering fails with a TypeError, because a string can't be compared with an integer","It renders every VLAN, because any non-empty string is greater than 50","It renders the VLANs whose ids sort after \"50\" as text, so \"6\" is included but \"100\" isn't","It renders nothing, because the comparison is always false"],
e:"Jinja2 uses Python's comparison, and Python 3 can't order str and int. Convert first with {% if v.id | int > 50 %}."},

{g:3,t:"3.3",p:"port.desc is an empty string. What does this line render?",
c:` description {{ port.desc | default("UNUSED") }}`,
o:["description, with nothing after it","description UNUSED","description None","An error, because desc is an empty string"],
e:"default only replaces undefined values. To also replace empty strings and other false values, use default(\"UNUSED\", true)."},

{g:3,t:"3.4",p:"A uri task runs in a loop over 20 sites with register: created. Which expression lists the JSON body of each response?",
o:["created.results | map(attribute=\"json\") | list","created.json","created | map(attribute=\"json\") | list","created.results | map(attribute=\"content\") | list"],
e:"A looped task registers one variable whose results list holds each iteration's result. Each item has its own json key."},

{g:3,t:"3.4",p:"A playbook changes Meraki firewall rules, and must restore the saved rules if any task in that group fails. Which construct fits?",
o:["A block containing the changes, with a rescue section that restores the rules","ignore_errors: true on each task, then a final restore task","A handler that restores the rules, notified by each change","failed_when: false on each task, so the play reaches the restore task"],
e:"rescue runs only when a task in its block fails, which suits rollback. ignore_errors and failed_when hide failures, and handlers run on changes, not on failures."},

{g:3,t:"3.4",p:"This task returns 415 Unsupported Media Type from Catalyst Center. What's the fix?",
c:`- name: Create a site
  ansible.builtin.uri:
    url: "https://{{ cc_host }}/dna/intent/api/v1/site"
    method: POST
    headers:
      X-Auth-Token: "{{ token }}"
    body: "{{ site_payload | to_json }}"
    status_code: [200, 202]`,
o:["Add body_format: json, so the body is sent with Content-Type: application/json","Remove to_json, so Ansible sends the dict as-is","Change method to PUT, which accepts any media type","Add return_content: true, so the response's media type matches the request's media type"],
e:"Without body_format, uri sends the body raw and sets no JSON content type. body_format: json serializes a dict and sets the header."},

{g:3,t:"3.5",p:"Which body fills the blank to apply group policy 101 to a client?",
c:`PUT /networks/{networkId}/clients/{clientId}/policy
________`,
o:["{\"devicePolicy\": \"Group policy\", \"groupPolicyId\": \"101\"}","{\"devicePolicy\": \"Group policy\", \"groupPolicy\": {\"id\": \"101\", \"name\": \"Contractors\"}}","{\"groupPolicy\": \"101\"}","{\"devicePolicy\": \"Blocked\", \"groupPolicyId\": \"101\"}"],
e:"devicePolicy chooses the policy type, and groupPolicyId names the group policy when that type is Group policy. Blocked ignores any group policy ID."},

{g:3,t:"3.5",p:"An audit must show who changed MX firewall rules in the last 24 hours. Which Dashboard API call fits?",
o:["GET /organizations/{organizationId}/configurationChanges?timespan=86400&networkId=<id>","GET /networks/{networkId}/events?productType=appliance","GET /organizations/{organizationId}/apiRequests?timespan=86400","GET /networks/{networkId}/appliance/firewall/l3FirewallRules?timespan=86400"],
e:"Configuration changes record the admin, time, page and old and new values. Events cover device activity, apiRequests covers only API calls, and the rules endpoint shows only the current state."},

{g:3,t:"3.5",p:"A known-bad IP range must be blocked at 100 MX networks, and updated later in one place. What's the best approach?",
o:["Create an organization policy object for the range, and reference it in each network's firewall rules","Add a rule with the range to each network, and rerun a script whenever it changes","Bind all 100 networks to one configuration template that holds the rule, even though their other settings differ","Add the range to each network's traffic shaping rules with a low priority"],
e:"Policy objects are defined once at the organization and referenced by firewall rules, so updating the object updates every rule that uses it. Traffic shaping limits bandwidth rather than blocking."},

{g:3,t:"3.6",p:"PUT /devices/{serial}/switch/ports/GigabitEthernet1%2F0%2F12 returns 404, although the switch has 48 ports. What's wrong?",
o:["Meraki identifies switch ports by number, so the portId is 12","The slashes must not be encoded, so the portId is GigabitEthernet1/0/12","Ports are changed at network level, so the serial is wrong","Port 12 must be enabled before it can be changed"],
e:"Meraki MS port IDs are the port numbers shown in the Dashboard. IOS-style interface names aren't valid IDs."},

{g:3,t:"3.6",p:"This Catalyst Center call returns 400 Bad Request. What's the fix?",
c:`payload = {"type": "area",
           "site": {"area": {"name": "Auckland", "parentName": "Global/NZ"}}}
r = requests.post(f"{base}/dna/intent/api/v1/site",
                  headers={"X-Auth-Token": token}, verify="ca.pem",
                  data=payload)`,
o:["Use json=payload, so the body is sent as JSON with the right header","Use params=payload, so the values go in the query string","Use files=payload, so the body is sent as multipart form data","Keep data=payload, and add Accept: application/json so Catalyst Center parses the body"],
e:"data= with a dict sends form-encoded fields, and nested dicts are flattened. json= serializes to JSON and sets Content-Type: application/json."},

{g:4,t:"4.1",p:"What does dev.learn(\"interface\") return in this test?",
c:`intf = dev.learn("interface")
down = [n for n, d in intf.info.items()
        if d.get("enabled") and d.get("oper_status") != "up"]
assert not down, f"Interfaces down: {down}"`,
o:["A Genie Ops object, whose info dict merges several show commands into one structure","The output of show interfaces, parsed into one dict, because learn and parse are the same","A list of dicts, one for each interface line in the output","A NETCONF reply from the interfaces-oper model"],
e:"learn runs several commands for a feature and merges them into a device-independent structure in .info. parse handles one command at a time."},

{g:4,t:"4.1",p:"After a WAN change, a team wants to confirm, from several agents and only once, that a SaaS URL responds normally. Which approach fits?",
o:["Run a ThousandEyes instant test through the API, then read its results","Create a scheduled ThousandEyes test with a one-minute interval and leave it running","Read Catalyst Center site health for the branch","Ping the SaaS host from the edge router with Command Runner"],
e:"Instant tests run once, on demand, from the chosen agents, which suits change validation. Site health and a ping don't show application-level response from the user's view."},

{g:4,t:"4.2",y:"o",p:"Put the virl2_client calls that delete a running lab in order.",
s:["lab.remove()","lab.wipe()","lab.stop()"],
o:["3, 2, 1","2, 3, 1","3, 1, 2","1, 3, 2"],
e:"A lab must be stopped before its nodes can be wiped, and wiped before it can be removed."},

{g:4,t:"4.2",p:"Why would a team add link conditioning to a CML topology before testing an SD-WAN policy change?",
o:["To add latency, jitter and loss on links, so path-selection behavior can be tested","To raise link bandwidth above what the host's hardware can carry","To encrypt traffic between lab nodes the way SD-WAN tunnels do, so policies see real IPsec","To make links come up faster when the lab starts"],
e:"Link conditioning impairs links in controlled ways, which lets policies such as application-aware routing be tested against degraded paths."},

{g:4,t:"4.3",p:"Which request uploads an image file from the script's host into the Catalyst Center repository?",
o:["POST /dna/intent/api/v1/image/importation/source/file, as a multipart/form-data upload","POST /dna/intent/api/v1/image/importation/source/url with the local path","POST /dna/intent/api/v1/image/distribution with the file in the body","PUT /dna/intent/api/v1/image/importation with the file base64-encoded in JSON"],
e:"Local files are uploaded with source/file as a multipart upload. source/url makes Catalyst Center fetch from an HTTP or FTP server, so a local path won't work."},

{g:4,t:"4.3",p:"Which body tags an image as golden for access switches of one family at one site?",
c:`POST /dna/intent/api/v1/image/importation/golden
________`,
o:["{\"imageId\": \"<image-id>\", \"siteId\": \"<site-id>\", \"deviceFamilyIdentifier\": \"<family-id>\", \"deviceRole\": \"ACCESS\"}","{\"imageId\": \"<image-id>\", \"deviceUuids\": [\"<device-id>\"], \"golden\": true}","{\"imageName\": \"cat9k_iosxe.17.12.04.SPA.bin\", \"site\": \"Global/NZ/AKL\", \"role\": \"ACCESS\"}","{\"imageId\": \"<image-id>\", \"siteId\": \"<site-id>\", \"deviceFamily\": \"Cisco Catalyst 9300 Switch\", \"role\": \"ACCESS\", \"golden\": true}"],
e:"Golden tags apply to an image for a site, device family and device role, not to individual devices, and they use IDs rather than names."},

{g:4,t:"4.4",p:"Which request lists the access switches with poor health in Catalyst Center?",
o:["GET /dna/intent/api/v1/device-health?deviceRole=ACCESS&health=POOR","GET /dna/intent/api/v1/site-health?deviceRole=ACCESS&health=POOR","GET /dna/intent/api/v1/network-device?role=ACCESS&reachabilityStatus=Unreachable","GET /dna/intent/api/v1/client-health?health=POOR"],
e:"device-health filters by role, site and health category. site-health reports per site, network-device has no health score, and client-health covers clients."},

{g:4,t:"4.4",p:"A report needs loss and latency for every MX uplink in the organization over the last few minutes. Which call fits?",
o:["GET /organizations/{organizationId}/devices/uplinksLossAndLatency?timespan=300","GET /organizations/{organizationId}/devices/statuses","GET /networks/{networkId}/appliance/uplinks/usageHistory","GET /organizations/{organizationId}/devices/uplinks/addresses/byDevice"],
e:"uplinksLossAndLatency returns loss and latency samples per uplink and destination. statuses shows online state, and usageHistory shows traffic volume."},

{g:4,t:"4.5",p:"Which element turns this dynamic subscription into an on-change subscription?",
c:`<establish-subscription
    xmlns="urn:ietf:params:xml:ns:yang:ietf-event-notifications"
    xmlns:yp="urn:ietf:params:xml:ns:yang:ietf-yang-push">
  <stream>yp:yang-push</stream>
  <yp:xpath-filter>/interfaces-ios-xe-oper:interfaces/interface/oper-status</yp:xpath-filter>
  ________
</establish-subscription>`,
o:["<yp:dampening-period>0</yp:dampening-period>","<yp:period>0</yp:period>","<yp:on-change>true</yp:on-change>","<yp:update-policy>on-change</yp:update-policy>"],
e:"yang-push uses period for periodic updates and dampening-period for on-change. A dampening period of 0 sends each change as it happens."},

{g:4,t:"4.5",p:"The collector is reachable only through the switch's GigabitEthernet0/0 management port, and the receiver stays Disconnected. What's missing?",
c:`telemetry ietf subscription 410
 encoding encode-kvgpb
 filter xpath /memory-ios-xe-oper:memory-statistics/memory-statistic
 stream yang-push
 update-policy periodic 6000
 receiver ip address 10.9.0.50 57000 protocol grpc-tcp`,
o:["source-vrf Mgmt-vrf under the subscription, for the dial-out connection","source-address 10.9.0.50 in the subscription","update-policy on-change instead of periodic","encoding encode-xml for grpc-tcp receivers"],
e:"The management port is in Mgmt-vrf, so the dial-out connection must be sourced from that VRF. source-address sets the switch's own address, not the collector's."},

{g:4,t:"4.6",p:"Before relying on a new Meraki webhook receiver, a team wants to send it a sample alert from the Dashboard API. Which calls do that?",
o:["POST /networks/{networkId}/webhooks/webhookTests, then GET the test by its ID for the result","POST /networks/{networkId}/alerts/settings/test with the receiver's URL and the alert type to simulate","GET /networks/{networkId}/webhooks/httpServers/{id}/ping","POST /organizations/{organizationId}/webhooks/send with a sample payload"],
e:"webhookTests sends a sample payload to a URL, optionally with a payload template, and reports whether delivery succeeded."},

{g:4,t:"4.6",p:"A Catalyst Center webhook receiver requires an API key in an X-Api-Key header. Where is it configured?",
o:["In the headers of the REST webhook destination","In the event subscription's filter","In the receiver URL as a query parameter","In Catalyst Center's system proxy settings, which add headers to outbound requests"],
e:"REST destinations hold custom headers, such as API keys or basic authentication, that are sent with every notification. Putting keys in URLs exposes them in logs."},

{g:5,t:"5.1",p:"Why are AI-driven baselines weaker at a site that came online last week?",
o:["Baselines learn from history, so a new site has too little data for reliable normal ranges","Baselines are calculated only once a year","New sites are excluded until their devices are upgraded","Baselines are built only from configuration data, and a new site has little configuration yet"],
e:"Dynamic baselines model normal behavior from telemetry over time, often by hour and weekday. With little history, the ranges are wide or missing."},

{g:5,t:"5.1",y:"m",p:"Which two limitations of AI insights in controllers should engineers keep in mind? (Choose two.)",
o:["Insights depend on the telemetry they receive, so missing data means missing insights","An insight can be wrong, so it needs checking before a change is made","Insights can't use telemetry, only the configuration stored in the controller","Insights always fix the problem without approval","Insights only work for networks with no Cisco devices"],
e:"AI insights are only as good as their data, and like any model they can be wrong. Most controller AI features recommend rather than act, leaving the decision with a person."},

{g:5,t:"5.2",p:"An AI assistant wrote this function. Which test input exposes its bug?",
c:`def all_up(states):
    # Purpose: report whether every interface is up
    for s in states:
        if s == "up":
            return True
    return False`,
o:["[\"up\", \"up\", \"down\"]","[\"up\", \"up\"]","[\"down\", \"down\"]","[\"down\"]"],
e:"The function returns True as soon as it finds one up, so a list with up before a down gives the wrong answer. The fix is all(s == \"up\" for s in states)."},

{g:5,t:"5.2",y:"m",p:"Which two are appropriate uses of an AI assistant in network automation development? (Choose two.)",
o:["Explaining an unfamiliar YANG model or script before changing it","Drafting unit tests from sample device output","Pushing generated configuration straight to production","Replacing peer review of pull requests","Keeping credentials in prompts so generated code works"],
e:"Assistants help with understanding and drafting, while review, testing and change control stay with people. Credentials never belong in prompts."},

{g:5,t:"5.3",p:"An agent builds NETCONF payloads by inserting model output into an XML string with f-strings. What's the main risk, and the fix?",
o:["Output with extra XML can inject unintended elements; build payloads with an XML library and validate them against the YANG model","The f-strings make the payload too large; compress it before sending","XML is slower to parse than JSON; switch to RESTCONF with JSON bodies, so injected content can't reach the device at all","There's no risk, because NETCONF rejects any element it doesn't recognize"],
e:"Unescaped model output can close tags and add its own elements, which may be valid YANG. Structured construction escapes values, and schema validation catches unexpected content."},

{g:5,t:"5.3",p:"A team wants to use a hosted LLM with device data, but policy forbids the data being kept or used for training. What addresses this?",
o:["Use a provider agreement with zero or limited retention and no training, or a self-hosted model","Use the provider's free public chat interface, which never keeps prompts or uses them for training","Encode the data in base64 before sending it, so the provider can't read it","Send the data only outside business hours"],
e:"Retention and training are contractual and deployment choices. Encoding doesn't hide data, and consumer chat services often keep prompts."},

{g:5,t:"5.4",p:"Which MCP request does a client send to fetch the content of this?",
c:`@mcp.resource("config://sites", mime_type="application/json")
def sites() -> dict:
    """All sites and their codes."""
    # Purpose: return the site list for context
    return load_sites()`,
o:["resources/read, with uri config://sites","tools/call, with name sites","resources/list, which returns each resource's content","prompts/get, with name sites"],
e:"resources/list returns resource names and URIs, and resources/read returns a resource's content. tools/call and prompts/get are for tools and prompts."},

{g:5,t:"5.4",p:"A FastMCP tool backs up 200 devices and takes several minutes. How can it show the client how far it's got?",
o:["Call await ctx.report_progress(progress=done, total=200) as each device finishes","Call print() after each device, because the client reads the server's stdout as progress updates","Return partial results every few devices, and keep the tool running","Raise a ToolError every 10 devices with the count so far"],
e:"Context.report_progress sends progress notifications that clients can display. A tool returns once, print corrupts stdio, and ToolError ends the call."},

{g:5,t:"5.4",y:"m",p:"A FastMCP server with tools that change Meraki settings will be exposed over HTTP to agents on other hosts. Which two should be in place? (Choose two.)",
o:["Authentication, such as bearer tokens the server verifies","TLS, directly or through a reverse proxy","A non-standard port, which keeps unauthorized clients out","Logging turned off, so tool arguments aren't recorded","The server running as root, so tools never fail on permissions"],
e:"Remote MCP servers are APIs and need authentication and encryption. An unusual port isn't access control, and audit logs and least privilege should stay."}
];
