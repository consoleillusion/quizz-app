// Questions for practice quiz 4 (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
{g:1,t:"1.1",p:"Which statement about OpenConfig models on IOS XE is accurate?",
o:["They're vendor-neutral, and IOS XE publishes deviation modules for the nodes it doesn't implement",
"They're vendor-neutral, but IOS XE can only advertise them if it implements every node in each model",
"They're vendor-neutral, but configuration applied through them can't be read back through the native model",
"They're published by the IETF, and IOS XE publishes deviation modules for the nodes it doesn't implement"],
e:"OpenConfig is written by an operator group, not the IETF. IOS XE translates OpenConfig configuration into its own running configuration, so the native model can read it, and deviation modules mark the unsupported nodes."},

{g:1,t:"1.2",y:"x",p:"Match each RESTCONF request, sent to a list entry that already exists, with its result.",
s:["POST to the parent list with the same key","PUT to the entry's URL","PATCH to the entry's URL","DELETE to the entry's URL"],
r:["The entry is removed","Only the leaves in the body change, and the rest are kept","The request fails with 409 Conflict","The entry is replaced, and leaves left out of the body are removed"],
o:["1-c, 2-d, 3-b, 4-a","1-d, 2-c, 3-b, 4-a","1-c, 2-b, 3-d, 4-a","1-b, 2-d, 3-c, 4-a"],
e:"POST creates, so it fails with data-exists (409) when the key exists. PUT replaces the target, PATCH merges into it, and DELETE removes it."},

{g:1,t:"1.3",p:"Which body for POST /restconf/data/example-qos:policies creates policy EDGE with class 10 set to drop, applied to Gi1 and Gi2?",
c:`module: example-qos
  +--rw policies
     +--rw policy* [name]
        +--rw name          string
        +--rw class* [id]
        |  +--rw id         uint8
        |  +--rw (action)?
        |     +--:(drop)
        |     |  +--rw drop?   empty
        |     +--:(mark)
        |        +--rw dscp?   uint8
        +--rw applies-to*   string`,
o:["{\"example-qos:policy\": [{\"name\": \"EDGE\", \"class\": [{\"id\": 10, \"drop\": [null]}], \"applies-to\": [\"Gi1\", \"Gi2\"]}]}",
"{\"example-qos:policy\": [{\"name\": \"EDGE\", \"class\": [{\"id\": 10, \"drop\": true}], \"applies-to\": [\"Gi1\", \"Gi2\"]}]}",
"{\"example-qos:policy\": [{\"name\": \"EDGE\", \"class\": [{\"id\": 10, \"drop\": null}], \"applies-to\": [\"Gi1\", \"Gi2\"]}]}",
"{\"example-qos:policy\": [{\"name\": \"EDGE\", \"class\": [{\"id\": 10, \"action\": {\"drop\": [null]}}], \"applies-to\": [\"Gi1\", \"Gi2\"]}]}"],
e:"RFC 7951 encodes a leaf of type empty as [null]. Choice and case names never appear in data, so drop sits directly in the class entry. uint8 values are JSON numbers."},

{g:1,t:"1.4",p:"The module's namespace is urn:example:sys. The edit must clear location whether or not it's currently set, without returning an error. Which <config> content does that?",
c:`module: example-sys
  +--rw system
     +--rw contact?    string
     +--rw location?   string`,
o:["<system xmlns=\"urn:example:sys\" xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><location nc:operation=\"remove\"/></system>",
"<system xmlns=\"urn:example:sys\" xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><location nc:operation=\"delete\"/></system>",
"<system xmlns=\"urn:example:sys\"><location operation=\"remove\"/></system>",
"<system xmlns=\"urn:example:sys\" xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><location nc:operation=\"none\"/></system>"],
e:"remove deletes the node if it exists and does nothing if it doesn't. delete returns data-missing when the node is absent. The attribute must be in the NETCONF base namespace, and none makes no change."},

{g:1,t:"1.5",p:"Which RESTCONF request runs reset on Gi1 with counters-only set?",
c:`module: example-if
  +--rw interfaces
     +--rw interface* [name]
        +--rw name      string
        +--ro errors?   uint32
        +---x reset
           +---w input
           |  +---w counters-only?   boolean
           +--ro output
              +--ro cleared?   uint32`,
o:["POST /restconf/data/example-if:interfaces/interface=Gi1/reset with {\"example-if:input\": {\"counters-only\": true}}",
"POST /restconf/operations/example-if:reset with {\"example-if:input\": {\"name\": \"Gi1\", \"counters-only\": true}}",
"POST /restconf/data/example-if:interfaces/interface=Gi1/reset with {\"example-if:reset\": {\"counters-only\": true}}",
"PUT /restconf/data/example-if:interfaces/interface=Gi1/reset with {\"example-if:input\": {\"counters-only\": true}}"],
e:"reset sits inside a list entry, so it's a YANG 1.1 action. Actions are invoked with POST on the data resource path, while top-level RPCs use /restconf/operations. The body wraps the parameters in module:input."},

{g:1,t:"1.5",y:"m",p:"Which two statements about this tree are true? (Choose two.)",
c:`module: example-bgp
  +--rw bgp
     +--rw asn          inet:as-number
     +--rw router-id?   inet:ipv4-address
     +--rw neighbor* [address]
     |  +--rw address     inet:ip-address
     |  +--rw remote-as   inet:as-number
     |  +--rw shutdown?   empty
     |  +--ro state?      enumeration
     +--rw bfd!`,
o:["Creating a neighbor requires both address and remote-as","bfd means something when it exists, even with no children","router-id must be set before any neighbor can be created","A client can set state to idle to reset a neighbor's session","shutdown takes the value true or false, and defaults to false"],
e:"remote-as has no ? marker, so it's mandatory, and ! marks a presence container. router-id is optional and independent, state is ro (read-only), and an empty leaf is either present or absent; it has no value."},

{g:2,t:"2.1",p:"Which except clause catches a wrong password for one device, but still lets an unreachable device fall through to the next handler?",
c:`from netmiko import ConnectHandler
from netmiko.exceptions import (NetmikoAuthenticationException,
                                NetmikoTimeoutException)

for dev in inventory:
    try:
        with ConnectHandler(**dev) as conn:
            results[dev["host"]] = conn.send_command("show version")
    ________:
        failed_auth.append(dev["host"])
    except NetmikoTimeoutException:
        unreachable.append(dev["host"])`,
o:["except NetmikoAuthenticationException","except NetmikoTimeoutException","except (NetmikoAuthenticationException, NetmikoTimeoutException)","except ConnectionRefusedError"],
e:"Netmiko raises NetmikoAuthenticationException for rejected credentials and NetmikoTimeoutException when the host can't be reached. Catching both in the first clause would put unreachable devices on the auth list."},

{g:2,t:"2.1",p:"The command prompts with Destination filename [startup-config]?. Which code saves the configuration without hanging?",
o:["out = conn.send_command(\"copy running-config startup-config\", expect_string=r\"Destination filename\")\nout += conn.send_command(\"\\n\", expect_string=r\"#\")",
"out = conn.send_command(\"copy running-config startup-config\", read_timeout=60)",
"out = conn.send_config_set([\"copy running-config startup-config\", \"\\n\"])",
"out = conn.send_command(\"copy running-config startup-config\", expect_string=r\"#\")\nout += conn.send_command(\"\\n\", expect_string=r\"Destination filename\")"],
e:"send_command waits for the normal prompt, which never appears while the device is asking a question. expect_string tells it what to wait for, and the second call answers with Enter. send_config_set would run the command in configuration mode."},

{g:2,t:"2.2",p:"Why does findall return an empty list here, although the reply contains interfaces?",
c:`FLT = """
<interfaces xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-interfaces-oper">
  <interface><name/><oper-status/></interface>
</interfaces>"""

reply = m.get(filter=("subtree", FLT))
root = reply.data_ele
for intf in root.findall(".//interface"):
    print(intf.findtext("name"), intf.findtext("oper-status"))`,
o:["The elements are namespace-qualified, so the search needs the namespace URI or a prefix map","get only returns configuration, so the reply holds no oper-status values to find","data_ele is a string, so findall searches its characters rather than any of its elements","The subtree filter must also select interface in a <filter> element, or nothing is returned"],
e:"lxml matches qualified names. Use root.findall(\".//if:interface\", {\"if\": \"http://cisco.com/ns/yang/Cisco-IOS-XE-interfaces-oper\"}) or the {uri}interface form. get returns state data, and data_ele is an element."},

{g:2,t:"2.2",p:"What does error_option=\"rollback-on-error\" do in this call?",
c:`m.edit_config(target="candidate", config=CFG,
              error_option="rollback-on-error")`,
o:["If any part of the edit fails, the whole edit is undone, so the datastore doesn't change","If any part fails, processing stops at that point, and changes made before the error stay in place","If any part fails, the device skips it and still applies the rest of the edit","If any part fails, the device rolls back to the configuration of its last commit"],
e:"rollback-on-error makes the edit atomic and needs the :rollback-on-error capability. stop-on-error keeps earlier changes, continue-on-error skips failures, and neither touches earlier commits."},

{g:2,t:"2.3",p:"The script must create a new loopback and get an error if it already exists. Which values fill blanks 1 and 2?",
c:`r = requests.__1__(f"{base}/data/ietf-interfaces:interfaces",
                   auth=auth, verify="corp-ca.pem", json=new_intf,
                   headers={"Content-Type": "__2__",
                            "Accept": "application/yang-data+json"})`,
o:["1: post, 2: application/yang-data+json","1: put, 2: application/yang-data+json","1: post, 2: application/json","1: patch, 2: application/yang-data+json"],
e:"POST creates a child and returns 409 if it exists, while PUT and PATCH would silently overwrite or merge. The body's media type for YANG JSON is application/yang-data+json."},

{g:2,t:"2.3",p:"A GET on /restconf/data/ietf-interfaces:interfaces-state must return only each interface's name and oper-status. Which query does that?",
o:["?fields=interface(name;oper-status)","?fields=interface[name;oper-status]","?fields=interface/name;oper-status","?depth=2&fields=name;oper-status"],
e:"In fields, ; separates siblings, / walks down a path, and parentheses apply a selection under one node. interface/name;oper-status would ask for oper-status at the top level, beside interface."},

{g:2,t:"2.3",p:"A RESTCONF POST creates a new list entry and returns 201 Created. Where does the response give the URL of the new resource?",
o:["In the Location header","In the body, under ietf-restconf:location","In the ETag header","Nowhere, so the client must build the URL from the key"],
e:"RFC 8040 returns 201 with a Location header pointing at the new resource. ETag identifies a version of a resource, and the body of a successful POST is empty."},

{g:2,t:"2.4",p:"The switch has Gi1/0/1 (access VLAN 10), Gi1/0/2 (access VLAN 20) and Gi1/0/3 (trunk). After this task, Gi1/0/1 is in VLAN 30, and Gi1/0/2 and Gi1/0/3 have no layer 2 configuration. Which state was used?",
c:`- name: Set layer 2 ports
  cisco.ios.ios_l2_interfaces:
    config:
      - name: GigabitEthernet1/0/1
        mode: access
        access:
          vlan: 30
    state: ________`,
o:["overridden","replaced","merged","deleted"],
e:"overridden makes the device match the list exactly, removing layer 2 settings from every interface not listed. replaced only rewrites the listed interfaces, merged adds to them, and deleted removes configuration."},

{g:2,t:"2.4",p:"The device's MGMT ACL differs from these lines by one entry. What does the task send?",
c:`- name: Enforce the MGMT ACL
  cisco.ios.ios_config:
    parents: ip access-list extended MGMT
    lines:
      - 10 permit tcp 10.0.0.0 0.0.0.255 any eq 22
      - 20 deny ip any any log
    before: no ip access-list extended MGMT
    match: exact`,
o:["no ip access-list extended MGMT, then the parent and both lines","The parent and only the entry that differs, without the before line","no ip access-list extended MGMT, then only the entry that differs","Nothing, because match: exact only reports differences without changing them"],
e:"With match: exact, any difference means the whole block is pushed, and before runs first whenever a change is needed. That rebuilds the ACL cleanly."},

{g:2,t:"2.5",p:"This ZTP script runs on a switch whose serial number isn't in CONFIGS. What happens?",
c:`import cli, re

CONFIGS = {"FOC2233X0AB": ["hostname BR21-SW1", "ip domain name corp.example"]}

def main():
    # Purpose: apply the configuration that matches this switch's serial number
    ver = cli.cli("show version")
    serial = re.search(r"System Serial Number\\s+:\\s+(\\S+)", ver).group(1)
    cli.configurep(CONFIGS[serial])

main()`,
o:["The lookup raises KeyError, so configurep never runs","CONFIGS[serial] returns None, so configurep runs with nothing to apply and returns","re.search returns None, so .group(1) raises AttributeError before the lookup","configurep applies an empty list and saves the configuration"],
e:"Indexing a dict with a missing key raises KeyError. The serial line is found, so the regex succeeds. Use CONFIGS.get(serial) with a fallback to handle unknown switches."},

{g:2,t:"2.5",y:"o",p:"Put the Catalyst Center discovery methods in the order an unconfigured switch tries them.",
s:["Cisco Plug and Play Connect in the cloud","DHCP option 43 with the PnP server's address","DNS lookup of pnpserver in the domain learned from DHCP"],
o:["2, 3, 1","3, 2, 1","2, 1, 3","1, 2, 3"],
e:"The switch first uses option 43. Without it, it looks up pnpserver.<domain> in DNS. If neither works, it contacts the PnP Connect cloud, which can redirect it to Catalyst Center."},

{g:2,t:"2.6",p:"This request returns the error below. What's the fix?",
c:`PATCH /restconf/data/ietf-interfaces:interfaces/interface=Loopback9
Content-Type: application/yang-data+json

{"ietf-interfaces:interface": [{"name": "Loopback9",
                                "type": "softwareLoopback",
                                "enabled": true}]}

HTTP/1.1 400 Bad Request
  "error-tag": "invalid-value",
  "error-path": "/ietf-interfaces:interfaces/interface[name='Loopback9']/type"`,
o:["Write the identity with its module, as \"iana-if-type:softwareLoopback\"","Send enabled as the string \"true\", which JSON YANG encoding requires","Use PUT instead, because PATCH can't change the type of an existing interface","Remove name from the body, because the key may only appear in the URL"],
e:"The error points at type, an identityref, whose value needs its module prefix. Booleans are JSON literals, PATCH can change type, and a key in the body is allowed when it matches the URL."},

{g:2,t:"2.6",p:"A NETCONF session to IOS XE opens, and get-config works, but every edit-config returns access-denied. What's the most likely cause?",
o:["The user doesn't have privilege 15, so NACM denies write access","The candidate datastore isn't enabled, so writes to running are refused","netconf-yang is listening on a port other than 830","The script set hostkey_verify=False, which limits the session to reads"],
e:"IOS XE applies NACM rules. Privilege 15 users get full access, and others are denied by default. A missing candidate gives a different error, and port and host key settings affect connecting, not authorization."},

{g:2,t:"2.7",p:"What does this applet do?",
c:`event manager applet CHECK-CRC
 event timer watchdog time 300
 action 1.0 cli command "enable"
 action 2.0 cli command "show interfaces GigabitEthernet1/0/1 | include CRC"
 action 3.0 regexp "([0-9]+) CRC" "$_cli_result" match crc
 action 4.0 if $_regexp_result eq "1"
 action 5.0  if $crc gt "100"
 action 6.0   syslog priority warnings msg "Gi1/0/1 CRC errors: $crc"
 action 7.0  end
 action 8.0 end`,
o:["Every 5 minutes, it logs a warning if Gi1/0/1's CRC counter is above 100","Every 5 minutes, it logs a warning if Gi1/0/1's CRC counter rose by more than 100 since its last run","Once, 300 seconds after the applet is registered, it logs Gi1/0/1's CRC counter","Every 5 minutes, it logs Gi1/0/1's CRC counter, whatever its value"],
e:"watchdog repeats every 300 seconds (countdown would run once). The regexp stores the number in crc, and the nested if only logs when it exceeds 100. Nothing tracks the previous value, so it compares the total, not the increase."},

{g:2,t:"2.7",y:"m",p:"Which two statements about Guest Shell on a Catalyst 9000 switch are true? (Choose two.)",
o:["It's a Linux container with Python 3, and pip can install packages when it has network access","The switch's bootflash is available inside it under /flash","It runs inside IOSd, so a script crash reloads the switch","It has root access to the IOS XE kernel and can change IOSd's memory","Its Python can only call the cli module, not general libraries"],
e:"Guest Shell is an isolated IOx container, so a script crash doesn't affect IOSd. It mounts bootflash at /flash, and it runs ordinary Python with pip."},

{g:3,t:"3.1",p:"A PnP site-claim for an access point fails, while switch claims with the same code succeed. What does the AP's claim need?",
o:["type set to AccessPoint, with an rfProfile","type set to Default, with an rfProfile","type set to AccessPoint, with configInfo pointing to an onboarding template","type set to StackSwitch, with imageInfo"],
e:"Access points are claimed with type AccessPoint and an RF profile. They don't take an onboarding template or image the way switches do."},

{g:3,t:"3.1",p:"Which SDK method fills the blank so the new branch's devices join the network?",
c:`net = dashboard.organizations.createOrganizationNetwork(
    org_id, name="BR-21", productTypes=["appliance", "switch"])
dashboard.networks.bindNetwork(net["id"], configTemplateId=tpl_id)
dashboard.networks.________(net["id"], serials=["Q2XX-AAAA-0001",
                                               "Q2XX-AAAA-0002"])`,
o:["claimNetworkDevices","claimIntoOrganization","updateNetworkDevices","bindNetworkDevices"],
e:"claimNetworkDevices adds devices from inventory to a network. claimIntoOrganization is an organization method for adding devices to inventory, and the other two don't exist."},

{g:3,t:"3.1",y:"o",p:"Put the steps that let a new WAN edge join Catalyst SD-WAN in order.",
s:["Mark the device's certificate as Valid in SD-WAN Manager","Send the WAN edge list to the Controllers and Validators","Upload the WAN edge serial list, or sync it from Plug and Play Connect","SD-WAN Manager pushes the configuration group to the edge","The edge connects, and the Validator checks it against the allow list"],
o:["3, 1, 2, 5, 4","1, 3, 2, 5, 4","3, 2, 1, 5, 4","3, 1, 5, 2, 4"],
e:"The device must be listed before it can be validated, and the controllers only know it's allowed once the list is sent. The Manager can push configuration only after the edge has joined."},

{g:3,t:"3.2",p:"Which expression prints the management IP of one device?",
c:`r = requests.get(f"{base}/dna/intent/api/v1/network-device/{dev_id}",
                 headers={"X-Auth-Token": token}, verify="ca.pem")
print(________)`,
o:["r.json()[\"response\"][\"managementIpAddress\"]","r.json()[\"response\"][0][\"managementIpAddress\"]","r.json()[\"managementIpAddress\"]","r.json()[\"data\"][\"managementIpAddress\"]"],
e:"Intent API replies wrap results in response. A lookup by ID returns one object, while the device list returns an array, which would need [0]."},

{g:3,t:"3.2",p:"Which exception does the Meraki Python SDK raise when the Dashboard returns a 4xx error?",
c:`try:
    dashboard.switch.updateDeviceSwitchPort(serial, "12", vlan=4095)
except ________ as e:
    print(e.status, e.message)`,
o:["meraki.APIError","requests.HTTPError","meraki.AsyncAPIError","ValueError"],
e:"The SDK wraps HTTP errors in meraki.APIError, which carries status, reason and message. AsyncAPIError is the asyncio client's version, and requests errors don't reach the caller."},

{g:3,t:"3.2",p:"GET /dataservice/device/bfd/sessions requires a deviceId parameter. Which value does SD-WAN Manager expect?",
o:["The device's system IP","The device's chassis serial number","The device's UUID from the inventory","The device's hostname"],
e:"Real-time device APIs identify the edge by its system IP. The UUID and serial number identify a device in inventory and certificate lists."},

{g:3,t:"3.2",p:"GET /ers/config/endpoint returns 20 endpoints, but ISE holds 5,000. How does the script get all of them?",
o:["Request pages with size (up to 100) and page, following nextPage until it's gone","Add ?limit=5000, which removes the default page size","Use offset and limit query parameters, in the same way the Catalyst Center API pages results","Change Accept to application/xml, which returns everything"],
e:"ERS pages results. Its SearchResult gives the total and a nextPage link, and size can be at most 100. offset and limit belong to other APIs."},

{g:3,t:"3.3",p:"What do the description lines render as?",
c:`{# switches = [{"name": "A", "ports": ["Gi1", "Gi2"]},
                {"name": "B", "ports": ["Gi1"]}] #}
{% for sw in switches %}
{% set outer = loop %}
{% for p in sw.ports %}
interface {{ p }}
 description {{ sw.name }}-{{ outer.index }}.{{ loop.index }}
{% endfor %}
{% endfor %}`,
o:["A-1.1, A-1.2, B-2.1","A-1.1, A-2.2, B-3.1","A-1.1, A-1.2, B-2.3","A-0.0, A-0.1, B-1.0"],
e:"Inside the inner loop, loop is the inner loop, so the outer one is saved as outer first. Both index counters start at 1, and the inner one restarts for each switch."},

{g:3,t:"3.3",p:"What does this line render?",
c:`{# ports = [{"name": "Gi1/0/48", "mode": "trunk"},
             {"name": "Gi1/0/1",  "mode": "access"},
             {"name": "Gi1/0/47", "mode": "trunk"}] #}
{{ ports | selectattr("mode", "equalto", "trunk") | map(attribute="name") | join(",") }}`,
o:["Gi1/0/48,Gi1/0/47","Gi1/0/47,Gi1/0/48","Gi1/0/1","trunk,trunk"],
e:"selectattr keeps the items whose mode equals trunk, in their original order. map pulls out their names, and join combines them. Nothing sorts the list."},

{g:3,t:"3.3",p:"A template renders cleanly with Ansible's template module, but the same file rendered from a Python script has blank lines after every {% %} tag. Why?",
o:["Ansible enables trim_blocks by default, but a plain jinja2.Environment doesn't","Ansible strips all blank lines from output, which Jinja2 can't do on its own","Python's Jinja2 adds a newline after each tag unless the file has Windows line endings","The script uses Template() instead of Environment(), which disables whitespace control"],
e:"trim_blocks removes the newline after a block tag. Create the environment with trim_blocks=True, and usually lstrip_blocks=True, to match Ansible's output."},

{g:3,t:"3.4",p:"This task prints the Catalyst Center token in verbose output and in the CI job log. Which change stops that?",
c:`- name: Get a Catalyst Center token
  ansible.builtin.uri:
    url: "https://{{ cc_host }}/dna/system/api/v1/auth/token"
    method: POST
    url_username: "{{ cc_user }}"
    url_password: "{{ cc_pass }}"
    force_basic_auth: true
  register: auth`,
o:["Add no_log: true to the task","Move cc_pass into ansible-vault","Add return_content: false to the task","Set ANSIBLE_DISPLAY_SKIPPED_HOSTS to false"],
e:"no_log hides the task's arguments and results from output and logs. Vault protects the password at rest, but the token is still printed after login."},

{g:3,t:"3.4",p:"A uri task that POSTs to Catalyst Center fails with \"Status code was 202 and not [200]\", although the request worked. What's the fix?",
o:["Add status_code: [200, 202] to the task","Add body_format: json to the task","Add follow_redirects: all to the task, so the 202 redirect is followed","Add validate_certs: false to the task"],
e:"uri treats anything outside status_code (default 200) as a failure. Intent API POSTs return 202 Accepted with a task ID, so 202 must be allowed."},

{g:3,t:"3.4",y:"m",p:"A playbook calls the Meraki API with uri for 200 networks, run as inventory hosts, and many tasks fail with 429. Which two changes help? (Choose two.)",
o:["Limit concurrency with throttle on the task, or use fewer forks","Retry on 429 with until, retries and a delay","Add validate_certs: false to speed up each call","Raise timeout to 120 seconds on the task","Switch the calls from GET to POST"],
e:"Meraki limits each organization to a few requests per second. Fewer parallel calls and retries after a pause address that. TLS settings and timeouts don't affect the rate limit."},

{g:3,t:"3.5",p:"Which body fills the blank to quarantine the endpoint with ANC policy QUARANTINE?",
c:`r = requests.put(f"https://{ise}:9060/ers/config/ancendpoint/apply",
                 auth=(ers_user, ers_pw), verify="ise-ca.pem",
                 headers={"Accept": "application/json"},
                 json=________)`,
o:["{\"OperationAdditionalData\": {\"additionalData\": [{\"name\": \"macAddress\", \"value\": \"00:11:22:33:44:55\"}, {\"name\": \"policyName\", \"value\": \"QUARANTINE\"}]}}",
"{\"ErsAncEndpoint\": {\"macAddress\": \"00:11:22:33:44:55\", \"policyName\": \"QUARANTINE\"}}",
"{\"OperationAdditionalData\": {\"macAddress\": \"00:11:22:33:44:55\", \"policyName\": \"QUARANTINE\"}}",
"{\"additionalData\": [{\"name\": \"macAddress\", \"value\": \"00:11:22:33:44:55\"}, {\"name\": \"policyName\", \"value\": \"QUARANTINE\"}]}"],
e:"ANC apply and clear take OperationAdditionalData with a list of name and value pairs. Without the wrapper, or with plain fields, ERS rejects the body."},

{g:3,t:"3.5",p:"Which request starts a fresh compliance check for two devices in Catalyst Center?",
o:["POST /dna/intent/api/v1/compliance with {\"triggerFull\": true, \"deviceUuids\": [\"<id1>\", \"<id2>\"]}","GET /dna/intent/api/v1/compliance?deviceUuid=<id1>,<id2>","POST /dna/intent/api/v1/compliance/detail with {\"deviceUuids\": [\"<id1>\", \"<id2>\"], \"categories\": [\"RUNNING_CONFIG\"]}","PUT /dna/intent/api/v1/network-device/sync with [\"<id1>\", \"<id2>\"]"],
e:"POST to compliance starts a run and returns a task. GET reads the latest results, compliance/detail is read with GET, and sync only refreshes inventory."},

{g:3,t:"3.5",y:"m",p:"Which two statements about VPNs in Catalyst SD-WAN are true? (Choose two.)",
o:["VPN 0 is the transport VPN that faces the WAN","Service VPNs such as VPN 10 keep a segment's routes separate across the fabric","VPN 512 carries user traffic between sites","All service VPNs share one routing table on each edge","VPN 0 is reserved for out-of-band management"],
e:"VPN 0 connects to the WAN transports, and VPN 512 is for out-of-band management. Each service VPN has its own routing table, end to end."},

{g:3,t:"3.6",p:"A script logs in to Catalyst Center with an Observer account. GET requests work, but POST /dna/intent/api/v1/network-device returns 403. What's the cause?",
o:["The account's role doesn't allow write operations","The token has expired and must be refreshed","The script exceeded the API rate limit","The body was sent without Content-Type: application/json"],
e:"403 means the caller is authenticated but not authorized. Observer is read-only. An expired token gives 401, rate limiting gives 429, and a media type problem gives 415 or 400."},

{g:3,t:"3.6",p:"A PUT to a REST API succeeds, but r.json() then raises JSONDecodeError. What's the most likely reason?",
o:["The response is 204 No Content, so there's no body to parse","The response is 201 Created, and its body is XML by default","The PUT failed silently, and the body holds an HTML error page","requests can't parse JSON from a PUT response"],
e:"Many APIs, including RESTCONF, answer a successful PUT with 204 and an empty body. Check r.status_code, or r.content, before calling r.json()."},

{g:4,t:"4.1",p:"After a reboot test, genie diff shows hundreds of changes in counters and uptime, which hide the real differences. What's the best fix?",
o:["Exclude those keys from the comparison, for example Diff(before, after, exclude=[\"counters\", \"uptime\"])","Run genie learn twice and diff only the second pair of snapshots","Compare the show running-config text instead, which has no counters","Clear the counters before the second learn, so they match"],
e:"Diff takes an exclude list of keys that change on their own. Running config ignores the operational state the test is meant to check, and clearing counters still leaves uptime and timers."},

{g:4,t:"4.1",p:"A new MX must be checked for reachability to 8.8.8.8, from the device itself, through the API. Which calls do that?",
o:["POST /devices/{serial}/liveTools/ping, then GET /devices/{serial}/liveTools/ping/{id} for the result","GET /devices/{serial}/liveTools/ping?target=8.8.8.8&count=5, which runs the test and returns the result directly","POST /networks/{networkId}/liveTools/ping with the MX serial in the body","GET /organizations/{organizationId}/devices/statuses for the MX"],
e:"Live tools run from the device. The POST starts the test and returns an ID, and the GET reads the result once it finishes. Status shows only whether the device is online."},

{g:4,t:"4.2",p:"Which virl2_client call returns a pyATS testbed for a running lab, so tests can connect to its nodes?",
o:["lab.get_pyats_testbed()","lab.export_testbed(\"pyats\")","client.testbed(lab.id)","lab.download()"],
e:"get_pyats_testbed returns testbed YAML with the lab's nodes and console access. download exports the lab topology, not a testbed."},

{g:4,t:"4.2",p:"A team tests a change on Catalyst 9000v nodes in CML before rolling it out to Catalyst 9300 switches. What won't the simulation reproduce?",
o:["TCAM exhaustion and hardware forwarding limits on the 9300","The IOS XE CLI and YANG models the change uses","NETCONF and RESTCONF behavior during the change","OSPF adjacencies forming and converging after the change"],
e:"Virtual nodes run the same IOS XE software, so control plane, CLI and API behavior match. They forward in software, so ASIC resources such as TCAM aren't modeled."},

{g:4,t:"4.3",p:"Which body fills the blank for POST /dna/intent/api/v1/image/distribution?",
c:`r = requests.post(f"{base}/dna/intent/api/v1/image/distribution",
                  headers=hdr, verify="ca.pem", json=________)`,
o:["[{\"deviceUuid\": \"<device-id>\", \"imageUuid\": \"<image-id>\"}]","{\"deviceUuids\": [\"<device-id>\"], \"imageUuid\": \"<image-id>\"}","[{\"deviceId\": \"<device-id>\", \"imageName\": \"cat9k_iosxe.17.12.04.SPA.bin\"}]","{\"device\": \"<device-id>\", \"image\": \"<image-id>\"}"],
e:"Distribution takes a list with one object per device, each naming the deviceUuid and imageUuid. Activation uses a similar list, with options for scheduling."},

{g:4,t:"4.3",p:"In PUT /networks/{networkId}/firmwareUpgrades, which part of the body chooses the switch firmware to install?",
o:["products.switch.nextUpgrade.toVersion.id, taken from the network's availableVersions","products.switch.currentVersion.id, set to the version wanted next","products.switch.nextUpgrade.toVersion.firmware, set to the image file name","upgradeWindow.version, which applies to every product in the network"],
e:"Each product has a nextUpgrade with a time and a toVersion ID chosen from availableVersions. The upgrade window sets when upgrades happen, not which version."},

{g:4,t:"4.4",p:"A report needs loss, latency and jitter per tunnel over the last hour, aggregated, from SD-WAN Manager. Which approach fits?",
o:["POST a query with a time range and grouping to /dataservice/statistics/approute/aggregation","GET /dataservice/device/bfd/sessions on each edge every few seconds for an hour, then average the samples","GET /dataservice/device/control/connections for each edge","GET /dataservice/alarms filtered on the last hour"],
e:"Statistics endpoints take a query in the body and return stored data, with aggregation done by the Manager. BFD sessions are real-time status, control connections cover the control plane, and alarms are events."},

{g:4,t:"4.4",p:"Which header authenticates a request to the ThousandEyes API v7?",
o:["Authorization: Bearer <OAuth bearer token>","Authorization: Basic <email:API token>","X-Auth-Token: <OAuth bearer token>","X-TE-Key: <API token>"],
e:"API v7 uses a bearer token created in the ThousandEyes account settings. Basic authentication with email and token belongs to the older v6 API."},

{g:4,t:"4.5",p:"Which value fills the blank so this configured subscription sends data every 30 seconds?",
c:`PATCH /restconf/data/Cisco-IOS-XE-mdt-cfg:mdt-config-data
{"Cisco-IOS-XE-mdt-cfg:mdt-config-data": {
  "mdt-subscription": [{
    "subscription-id": 301,
    "base": {"stream": "yang-push", "encoding": "encode-kvgpb",
             "period": ________,
             "xpath": "/process-cpu-ios-xe-oper:cpu-usage/cpu-utilization"},
    "mdt-receivers": [{"address": "10.9.0.50", "port": 57000,
                       "protocol": "grpc-tcp"}]}]}}`,
o:["3000","30","30000","300"],
e:"The period is in centiseconds, so 30 seconds is 3000. The same units apply in the CLI's update-policy periodic and in NETCONF."},

{g:4,t:"4.5",y:"m",p:"show telemetry ietf subscription 301 reports the subscription as Valid, but its receiver as Disconnected, and the collector gets nothing. Which two could cause this? (Choose two.)",
o:["The collector isn't listening on the configured address and port","An ACL, route or the source VRF stops the switch reaching the collector","The XPath filter selects a path that this stream doesn't support for periodic updates","The period is too short for kvgpb encoding","The subscription needs a NETCONF session to stay open"],
e:"A Valid subscription with a Disconnected receiver means the dial-out connection fails. A bad XPath would make the subscription Invalid, and configured subscriptions don't depend on a NETCONF session."},

{g:4,t:"4.6",p:"A Meraki network must send alerts to a receiver that expects a different JSON layout from Meraki's default. What fits best?",
o:["Create a webhook payload template that formats the alert, and assign it to the webhook server","Have the receiver call the Dashboard API for each alert, then rebuild the payload in the layout it expects","Use the syslog server setting instead, which lets you define the JSON fields","Ask Meraki support to change the payload layout for the organization"],
e:"Payload templates, written in Liquid and managed through the Dashboard or the API, reshape the webhook body for each receiver. Syslog sends text messages, not custom JSON."},

{g:4,t:"4.6",p:"Where are ThousandEyes alerts set up to POST to a custom HTTPS receiver?",
o:["As a webhook integration, selected in the notifications of an alert rule","In the test's agent settings, as a second target","As a dashboard widget that streams to a URL","Through a Catalyst Center event subscription"],
e:"Webhook integrations define the receiver, and alert rules choose which integrations get notified when they trigger."},

{g:5,t:"5.1",p:"An admin with read-only Meraki access asks the AI Assistant to change an SSID's password. What should happen?",
o:["The assistant can't make changes beyond the admin's own permissions","The assistant makes the change, because it runs with its own full-admin rights","The assistant makes the change and notifies the organization's full admins","The assistant can't take actions of any kind, for any admin"],
e:"AI assistants act within the user's role. An assistant with rights the user lacks would be a privilege escalation path."},

{g:5,t:"5.1",p:"Which Catalyst Center capability runs automated troubleshooting workflows, such as checking devices against security advisories, using a knowledge base of expert reasoning?",
o:["The Machine Reasoning Engine","AI Endpoint Analytics","Software Image Management","Path Trace"],
e:"The Machine Reasoning Engine powers the Network Reasoner workflows. Endpoint Analytics classifies devices, SWIM manages images, and Path Trace maps a flow's route."},

{g:5,t:"5.2",p:"An AI-generated function passes a review test with Loopback1 but fails in production. Which test case would have caught the bug, and what's the fix?",
c:`def get_intf(base, auth, name):
    # Purpose: read one interface over RESTCONF
    url = f"{base}/data/ietf-interfaces:interfaces/interface={name}"
    r = requests.get(url, auth=auth, verify="corp-ca.pem",
                     headers={"Accept": "application/yang-data+json"})
    r.raise_for_status()
    return r.json()`,
o:["A name with slashes, such as GigabitEthernet1/0/1; build the URL with quote(name, safe=\"\")","A name with slashes, such as GigabitEthernet1/0/1; build the URL with quote(name)","A name with slashes, such as GigabitEthernet1/0/1; pass it with params={\"name\": name}","A longer name, such as TenGigabitEthernet1/1/1; raise the request timeout so long names don't time out"],
e:"urllib.parse.quote leaves / unencoded by default (safe=\"/\"), so only safe=\"\" produces %2F. RESTCONF keys belong in the path, not the query string."},

{g:5,t:"5.2",y:"m",p:"Which two are effective ways to check an API call that an AI assistant suggested? (Choose two.)",
o:["Compare it with the platform's API reference for your release","Run it against a sandbox or lab instance and inspect the response","Ask the assistant whether it's sure about the call","Accept it if several AI answers, from different assistants, suggest the same call","Check that the code passes a formatter without changes"],
e:"Documentation and real responses are independent evidence. Self-checks and agreement between AI answers can repeat the same mistake, and formatting says nothing about correctness."},

{g:5,t:"5.3",y:"m",p:"An LLM summarizes syslog for the NOC and can also open change tickets and run show commands through tools. Which two controls limit damage from injected text in log messages? (Choose two.)",
o:["Keep the summarizer read-only, separate from any tool that changes devices","Require human approval before any action the model proposes is carried out","Tell the model in its system prompt to ignore any instructions that appear inside logs","Use a larger model, which follows injected instructions less often","Filter out log messages longer than 200 characters"],
e:"Prompt instructions and bigger models reduce injection but don't prevent it. Limiting the model's tools and requiring approval contain the damage whatever it decides."},

{g:5,t:"5.3",p:"An engineer pastes running configurations with type 7 passwords into a public AI chat to get help. Why is this a problem even though the passwords look encrypted?",
o:["Type 7 is reversible encoding, so the passwords are effectively in plain text","Type 7 values are salted hashes that need GPU time to crack, so the risk is low but real","The AI provider can only read type 5 and type 9 secrets, not type 7","It isn't a problem, because type 7 passwords can't be reversed"],
e:"Type 7 is a weak, reversible encoding, and tools decode it instantly. Redact secrets of every type, plus SNMP communities and keys, before sharing configurations."},

{g:5,t:"5.4",p:"How should a FastMCP tool report that a requested device doesn't exist, so the model gets a clear message?",
o:["raise ToolError(\"Device akl-sw9 not found\") from fastmcp.exceptions","return None, which the client shows as a not-found error","print(\"Device not found\") and return an empty list","Call sys.exit(1), which the client reports as a failed tool"],
e:"ToolError sends its message to the client as a tool error, even when other exception details are masked. None or an empty result looks like success, print corrupts stdio, and exiting kills the server."},

{g:5,t:"5.4",p:"How can a FastMCP server tell clients, in a structured way, that a tool only reads data?",
o:["@mcp.tool(annotations={\"readOnlyHint\": True})","Name the tool with a get_ prefix, so clients infer that it's read-only","Write \"read-only\" in the tool's docstring, so the model sees it","Register it with @mcp.resource() instead, since tools always count as writes"],
e:"Tool annotations, such as readOnlyHint and destructiveHint, are standard MCP metadata that clients can use, for example to skip confirmation. Names and docstrings are only hints to the model."},

{g:5,t:"5.4",p:"Claude Desktop starts this server as a local subprocess. Which values fill blanks 1 and 2?",
c:`from fastmcp import FastMCP

mcp = FastMCP("catalyst")

@mcp.__1__
def list_devices(site: str) -> list[dict]:
    """List the managed devices at one site."""
    # Purpose: return the devices Catalyst Center manages at a site
    return cc_devices(site)

if __name__ == "__main__":
    mcp.run(transport="__2__")`,
o:["1: tool(), 2: stdio","1: resource(), 2: stdio","1: tool(), 2: http","1: prompt(), 2: sse"],
e:"A function the model calls with an argument is a tool. A client that launches the server as a subprocess talks to it over stdio, while http is for remote clients."}
];
