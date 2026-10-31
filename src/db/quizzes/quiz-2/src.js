// Questions for practice quiz 2. Correct option(s) are written first; mk.js shuffles them.
module.exports = [
{g:1,t:"1.1",p:"IOS XE supports openconfig-interfaces but doesn't implement a few of its leaves. How does the device tell clients which parts are missing?",
o:["It publishes a deviation module that marks those nodes as not supported","It returns empty values for those leaves without telling the client","It moves the unsupported leaves into the Cisco-IOS-XE-native namespace","It can't advertise the model at all, because OpenConfig requires every leaf"],
e:"Deviation modules declare where an implementation differs from a model, for example nodes marked not-supported. Clients find them in the device's capabilities or YANG library."},

{g:1,t:"1.2",p:"A RESTCONF client doesn't know the API root path on a new device. How does RFC 8040 let it find the root?",
o:["GET /.well-known/host-meta, which returns a link with rel=\"restconf\"","GET /restconf/data/ietf-yang-library:modules-state, which lists the root","Read the SSH login banner, which prints the RESTCONF root path","GET /api/v1/root, which every RESTCONF server must answer"],
e:"The host-meta document points to the RESTCONF root, which is /restconf on IOS XE. The YANG library lists modules, not the root."},

{g:1,t:"1.3",p:"This body is POSTed to /restconf/data/ietf-interfaces:interfaces to create Loopback7. The type is the softwareLoopback identity from the iana-if-type module. Which body is valid?",
c:`module: ietf-interfaces
  +--rw interfaces
     +--rw interface* [name]
        +--rw name       string
        +--rw type       identityref
        +--rw enabled?   boolean`,
o:["{\"ietf-interfaces:interface\": [{\"name\": \"Loopback7\", \"type\": \"iana-if-type:softwareLoopback\", \"enabled\": true}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback7\", \"type\": \"softwareLoopback\", \"enabled\": true}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback7\", \"type\": \"iana-if-type:softwareLoopback\", \"enabled\": \"true\"}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback7\", \"type\": {\"iana-if-type\": \"softwareLoopback\"}, \"enabled\": true}]}"],
e:"An identityref value from another module is prefixed with that module's name, and a boolean is a JSON literal, not a string."},

{g:1,t:"1.4",p:"The module's namespace is urn:example:dns. Which edit-config payload removes only server 10.0.0.53?",
c:`module: example-dns
  +--rw dns
     +--rw server* [address]
        +--rw address   inet:ip-address
        +--rw port?     uint16`,
o:["<config xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><dns xmlns=\"urn:example:dns\"><server nc:operation=\"delete\"><address>10.0.0.53</address></server></dns></config>",
"<config xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><dns xmlns=\"urn:example:dns\" nc:operation=\"delete\"><server><address>10.0.0.53</address></server></dns></config>",
"<config><dns xmlns=\"urn:example:dns\"><server operation=\"remove\"><address>10.0.0.53</address></server></dns></config>",
"<config xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><dns xmlns=\"urn:example:dns\"><server><address nc:operation=\"delete\">10.0.0.53</address></server></dns></config>"],
e:"The operation attribute goes on the list entry and uses the NETCONF base namespace. On the container it would delete every server, and a key leaf can't be deleted on its own."},

{g:1,t:"1.5",p:"Which statement about this tree is correct?",
c:`module: example-ports
  +--rw ports
     +--rw port* [name]
        +--rw name     string
        +--ro flaps?   uint32

  rpcs:
    +---x clear-flaps
       +---w input
          +---w name   string

  notifications:
    +---n port-flap
       +--ro name   string`,
o:["clear-flaps is an operation that takes a port name, and port-flap is an event the device can send","clear-flaps is a configurable container, and port-flap is a list of ports that have flapped","flaps is configuration that clients reset by writing 0 to it, so the clear-flaps operation is redundant","port-flap is an RPC that clients call to read the flap counter of one port"],
e:"x marks an RPC or action, w marks its input, and n marks a notification. flaps is ro, so it's state data that clients can't write."},

{g:1,t:"1.5",y:"m",p:"Which two statements about this tree are correct? (Choose two.)",
c:`module: example-lag
  +--rw lags
     +--rw lag* [id]
        +--rw id           uint8
        +--rw member*      -> /if:interfaces/interface/name
        +--rw min-links?   uint8
        +--rw bfd!         {lag-bfd}?
           +--rw interval?   uint16`,
o:["Each member value must match the name of an interface that exists","bfd exists only on devices that support the lag-bfd feature","member is a list keyed by interface name, so it needs its own key leaf","min-links is mandatory, because the model gives it no default value","bfd is a presence container, so interval must be set whenever bfd exists"],
e:"-> marks a leafref, which must point at an existing value, and member* without a key is a leaf-list. {lag-bfd}? marks a feature condition, and ! marks a presence container that means something even when it's empty."},

{g:2,t:"2.1",p:"What does use_textfsm=True change in this function?",
c:`from netmiko import ConnectHandler

def down_ports(dev):
    # Purpose: list interfaces whose status is down
    with ConnectHandler(**dev) as conn:
        rows = conn.send_command("show ip interface brief", use_textfsm=True)
    return [r for r in rows if r["status"] == "down"]`,
o:["It returns a list of dicts parsed with an ntc-templates template, one per interface","The device sends JSON instead of text, so no parsing happens in Python","Netmiko sends the command over NETCONF instead of SSH and returns the reply as an XML element tree","The output stays one string, so the list comprehension raises a TypeError"],
e:"With use_textfsm, Netmiko runs the output through the matching ntc-templates template and returns structured rows. If no template matches, it returns the raw string."},

{g:2,t:"2.1",p:"send_command(\"show tech-support\") raises ReadTimeout on a large switch, although the command finishes fine on the CLI. What's the fix?",
o:["Pass a longer read_timeout, such as read_timeout=300, to that send_command call","Use send_command_timing, which never waits for the prompt and always returns the full output","Set fast_cli=True on the connection so the output arrives sooner","Send terminal length 0 first, because paging is what stops the output from finishing"],
e:"In Netmiko 4, read_timeout sets how long send_command waits for the prompt, and the default of 10 seconds is too short for long output. Netmiko already turns off paging when the session opens."},

{g:2,t:"2.2",p:"The script ends without sending another commit. What happens to the change?",
c:`with manager.connect(**params) as m:
    m.edit_config(target="candidate", config=CFG)
    m.commit(confirmed=True, timeout="120")
    print("change applied")
# the with block closes the NETCONF session here`,
o:["It's rolled back when the session closes, because no confirming commit was sent","It's rolled back after 120 seconds, even though the session has already closed","It stays in running-config, because the first commit already made it permanent","It stays only in the candidate datastore, because a confirmed commit doesn't touch running"],
e:"Without a confirming commit, the device restores the previous configuration when the timeout expires or when the session that issued the commit closes, whichever comes first. The persist parameter lets a later session confirm it."},

{g:2,t:"2.2",p:"Before using the candidate datastore, a script should check that the device supports it. Which check fits?",
o:["Look for urn:ietf:params:netconf:capability:candidate:1.0 in m.server_capabilities","Call m.get_config(source=\"candidate\") and treat any reply as support","Check that the device runs IOS XE 17 or later, which always enables candidate","Look for Cisco-IOS-XE-native in the YANG module list, which includes candidate"],
e:"Devices announce their NETCONF capabilities in the hello, and ncclient exposes them as server_capabilities. IOS XE only offers candidate after netconf-yang feature candidate-datastore is configured."},

{g:2,t:"2.3",p:"A script needs only the operational state under a RESTCONF resource, without its configuration. Which query parameter does that?",
o:["?content=nonconfig","?depth=state","?fields=oper","?with-defaults=state-only"],
e:"content takes config, nonconfig or all (the default). depth limits nesting levels, fields selects named nodes, and with-defaults controls how default values are reported."},

{g:2,t:"2.3",p:"This request returns 415 Unsupported Media Type. What's the fix?",
c:`r = requests.patch(f"{base}/data/Cisco-IOS-XE-native:native/hostname",
                   json={"Cisco-IOS-XE-native:hostname": "EDGE-09"},
                   auth=auth, verify="corp-ca.pem",
                   headers={"Accept": "application/yang-data+json"})
print(r.status_code)   # 415`,
o:["Add Content-Type: application/yang-data+json to the headers","Change Accept to application/json, since the body is plain JSON","Use data=json.dumps(body) instead of json=, since json= isn't allowed with PATCH","Use PUT instead, because PATCH can't change a single leaf"],
e:"json= sets Content-Type to application/json, which the device rejects for a YANG data body. Accept only affects the reply, and PATCH can target a leaf."},

{g:2,t:"2.3",p:"Loopback10 has a description and an IPv4 address. A RESTCONF PUT to its Cisco-IOS-XE-native URL sends only the name and a new description. What happens to the address?",
o:["It's removed, because PUT replaces the whole target resource with the body","It's kept, because PUT merges the body into the existing configuration","It's kept, because RESTCONF never deletes a leaf that the request body leaves out","The request fails with 409, because the interface already exists"],
e:"PUT replaces the target, so anything missing from the body is deleted. PATCH merges, and only POST returns 409 for an existing resource."},

{g:2,t:"2.4",p:"The interface already has description PRINTER but no access VLAN. What does this task send?",
c:`- name: Set access port
  cisco.ios.ios_config:
    parents: interface GigabitEthernet1/0/5
    lines:
      - description PRINTER
      - switchport access vlan 30`,
o:["interface GigabitEthernet1/0/5 followed by switchport access vlan 30","Both lines under the interface, because ios_config always sends every listed line","Only switchport access vlan 30, in global configuration mode without the parent","Nothing, because the description already matches and the task stops there"],
e:"ios_config compares the lines with the running config under the parent and sends only what's missing, with the parent line first so the command lands in the right mode."},

{g:2,t:"2.4",p:"A playbook must read the current VLAN configuration from switches as structured data, without changing anything. Which cisco.ios.ios_vlans state fits?",
o:["state: gathered","state: parsed","state: rendered","state: merged"],
e:"gathered reads the device and returns structured facts. parsed converts config text you supply without contacting the device, rendered produces commands offline, and merged makes changes."},

{g:2,t:"2.5",p:"What does this ZTP script do?",
c:`import cli

def main():
    # Purpose: apply base configuration during ZTP
    cli.configurep(["hostname BR12-SW1",
                    "ip domain name corp.example",
                    "crypto key generate rsa modulus 2048"])
    cli.executep("write memory")

main()`,
o:["It applies the three lines in configuration mode, prints the output, then saves the configuration","It writes the lines to a file on flash, which the switch loads at its next reload","It sends the lines to the DHCP server, which pushes them back to the switch over TFTP","It only prints the commands, because ZTP scripts can't change the configuration"],
e:"In Guest Shell, the cli module's configure functions apply lines in config mode and execute runs EXEC commands. The p variants also print the output."},

{g:2,t:"2.5",p:"A lab switch that already has a startup configuration is reloaded to test ZTP, but ZTP doesn't start. Why?",
o:["ZTP only runs when the switch boots with no startup configuration","ZTP only runs on the first boot after manufacture, so this switch can't use it again","ZTP needs a PnP license, which is removed when the switch is reloaded","ZTP waits 24 hours after a reload before it asks DHCP for a script"],
e:"Erase the startup configuration (write erase) and reload to trigger ZTP again. It isn't limited to the first boot and needs no special license."},

{g:2,t:"2.6",p:"A script that creates VLANs gets this reply. What's wrong?",
c:`HTTP/1.1 400 Bad Request
{
  "errors": {
    "error": [{
      "error-type": "application",
      "error-tag": "invalid-value",
      "error-path": "/Cisco-IOS-XE-native:native/vlan/Cisco-IOS-XE-vlan:vlan-list[id='4095']"
    }]
  }
}`,
o:["The VLAN ID is outside the range the YANG model allows for id","The VLAN already exists, so the script must use PATCH instead","The token has expired, so the script must log in again","The body is XML, but the Content-Type header says JSON"],
e:"invalid-value means a value breaks a constraint in the model, here the range of the id leaf. An existing item gives data-exists, bad credentials give 401, and a media type mismatch gives 415."},

{g:2,t:"2.6",y:"m",p:"ncclient times out connecting to a switch on port 830, but SSH on port 22 works. Which two should be checked? (Choose two.)",
o:["netconf-yang is configured, so the NETCONF agent listens on 830","An ACL or firewall between the script and the switch permits TCP 830","restconf is configured, because NETCONF runs on top of the HTTPS server","hostkey_verify is True, because ncclient times out on unknown host keys","Guest Shell is running, because the NETCONF agent runs inside it"],
e:"A timeout means nothing answered on 830: either the agent isn't running or the path is blocked. NETCONF doesn't need RESTCONF or Guest Shell, and a host key problem gives an error rather than a timeout."},

{g:2,t:"2.7",p:"When does this applet run, and what does it do?",
c:`event manager applet NIGHTLY-BACKUP
 event timer cron cron-entry "0 2 * * *"
 action 1.0 cli command "enable"
 action 2.0 cli command "show running-config | redirect bootflash:nightly.cfg"
 action 3.0 syslog msg "Nightly config copy saved"`,
o:["Every day at 02:00, it saves the running configuration to a file on bootflash","Every 2 hours, it saves the running configuration to a file on bootflash","On the 2nd of each month, it adds the running configuration to the end of a file","Two minutes after each reload, it copies the running configuration to startup"],
e:"Cron fields are minute, hour, day of month, month and day of week, so 0 2 * * * means 02:00 every day. | redirect overwrites the file, unlike | append."},

{g:2,t:"2.7",y:"m",p:"Which two statements about the Python cli module in IOS XE Guest Shell are true? (Choose two.)",
o:["cli.cli() runs an EXEC command and returns its output as a string","cli.configure() applies a list of configuration lines to the device","It opens an SSH session to the device, so it needs a username and password","It can only run show commands, so configuration changes need NETCONF","It's available only inside EEM Tcl policies, not in Python scripts"],
e:"The cli module talks to IOS XE from inside Guest Shell without logging in. It can run EXEC commands and apply configuration."},

{g:3,t:"3.1",p:"An unclaimed device appears in Catalyst Center Plug and Play. Which API claims it to a site with an image and a template?",
o:["POST /dna/intent/api/v1/onboarding/pnp-device/site-claim","POST /dna/intent/api/v1/network-device with the device's serial number","PUT /dna/intent/api/v1/site/{siteId}/device with the PnP device ID","POST /dna/intent/api/v1/onboarding/pnp-device/import with the device ID"],
e:"site-claim assigns a PnP device to a site with its image and configuration. pnp-device/import adds devices to the PnP list ahead of time, and network-device adds devices that are already reachable to inventory."},

{g:3,t:"3.1",y:"o",p:"Put the Catalyst SD-WAN plug-and-play onboarding steps for a new WAN edge in order.",
s:["The edge authenticates to the SD-WAN Validator, which tells it how to reach SD-WAN Manager and the Controllers","The device's serial number is added in Plug and Play Connect and synced to SD-WAN Manager","SD-WAN Manager pushes the edge's configuration from its configuration group or template","The edge boots and contacts the Plug and Play Connect cloud service to find its Validator"],
o:["2, 4, 1, 3","4, 2, 1, 3","2, 1, 4, 3","2, 4, 3, 1"],
e:"The serial must be listed before the edge can be redirected, the edge must reach the Validator before it can find the Manager, and the Manager can only push configuration once the edge connects to it."},

{g:3,t:"3.1",p:"Fifty new branch networks need the same MX and MS configuration, kept in one place so later changes reach every branch. Which Dashboard API approach fits?",
o:["Create a configuration template and bind each network to it with POST /networks/{networkId}/bind","Claim every branch's devices into one network, so all fifty branches share its configuration","Copy the settings into each network with a script, then rerun it whenever something changes","Create each network with copyFromNetworkId, so later changes to the source reach the copies"],
e:"Bound networks follow the template, so a change to the template reaches all of them. Copying settings is a one-time copy that drifts afterwards."},

{g:3,t:"3.2",p:"This Command Runner request completes. Where does the script get the show version output?",
c:`r = requests.post(f"{base}/dna/intent/api/v1/network-device-poller/cli/read-request",
                  headers=hdr, verify="ca.pem",
                  json={"commands": ["show version"], "deviceUuids": [dev_id]})
task_id = r.json()["response"]["taskId"]`,
o:["From GET /dna/intent/api/v1/file/{fileId}, with the fileId from the finished task","From the POST response itself, under response.output","From GET /dna/intent/api/v1/network-device/{id}/config, where the output is stored","From the device directly, because Command Runner only checks the syntax"],
e:"Command Runner is asynchronous. The finished task's progress holds a fileId, and that file holds each command's output for each device."},

{g:3,t:"3.2",p:"No API key is passed to DashboardAPI here. Where does the SDK get it?",
c:`import meraki

def org_names():
    # Purpose: list the organizations this API key can reach
    dashboard = meraki.DashboardAPI(suppress_logging=True)
    return [o["name"] for o in dashboard.organizations.getOrganizations()]`,
o:["From the MERAKI_DASHBOARD_API_KEY environment variable","From a meraki.cfg file in the user's home directory","It prompts for the key on the console the first time it runs","It doesn't need one, because getOrganizations is a public call that any client can make"],
e:"The SDK reads MERAKI_DASHBOARD_API_KEY when no key is passed, which keeps the key out of the code. Every Dashboard API call needs a key."},

{g:3,t:"3.2",p:"A script needs every device in the SD-WAN overlay with its system IP and reachability. Which SD-WAN Manager API returns that?",
o:["GET /dataservice/device","GET /dataservice/template/device","GET /dataservice/client/token","GET /dataservice/statistics/approute"],
e:"/dataservice/device lists devices with fields such as system-ip and reachability. The template endpoint lists device templates, client/token returns the XSRF token, and approute holds tunnel statistics."},

{g:3,t:"3.2",p:"Which body creates endpoint 00:11:22:33:44:55 in an existing identity group through ISE ERS?",
c:`body = ________
r = requests.post(f"https://{ise}:9060/ers/config/endpoint",
                  auth=(ers_user, ers_pw), json=body, verify="ise-ca.pem",
                  headers={"Accept": "application/json"})`,
o:["{\"ERSEndPoint\": {\"mac\": \"00:11:22:33:44:55\", \"groupId\": \"<group-id>\", \"staticGroupAssignment\": true}}",
"{\"mac\": \"00:11:22:33:44:55\", \"groupId\": \"<group-id>\", \"staticGroupAssignment\": true}",
"{\"endpoint\": {\"mac\": \"00:11:22:33:44:55\", \"group\": \"<group-name>\"}}",
"{\"ERSEndPoint\": {\"name\": \"00:11:22:33:44:55\", \"groupName\": \"<group-name>\", \"staticGroupAssignment\": \"yes\"}}"],
e:"ERS bodies wrap the object in a member named for its type, such as ERSEndPoint. The endpoint is identified by mac and its group by groupId, and staticGroupAssignment stops profiling from moving it."},

{g:3,t:"3.3",p:"What does this template render?",
c:`{# dns = ["10.1.1.53", "10.2.1.53"], domain = "CORP.Example" #}
ip name-server {{ dns | join(" ") }}
ip domain name {{ domain | lower }}`,
o:["ip name-server 10.1.1.53 10.2.1.53 / ip domain name corp.example","ip name-server ['10.1.1.53', '10.2.1.53'] / ip domain name corp.example","ip name-server 10.1.1.53 / ip name-server 10.2.1.53 / ip domain name CORP.Example","ip name-server 10.1.1.53 10.2.1.53 / ip domain name CORP.Example"],
e:"join places the list items in one string with the given separator, and lower converts the text to lowercase."},

{g:3,t:"3.3",p:"What does the hyphen in {%- if shutdown %} do?",
o:["It removes the whitespace, including newlines, before the tag","It removes the whitespace, including newlines, after the tag","It negates the condition, so the block renders when shutdown is false","It marks the block as a comment that isn't rendered"],
e:"A hyphen on the left side of a tag trims whitespace before it, and one on the right (-%}) trims whitespace after it. Jinja2 negates a condition with not."},

{g:3,t:"3.3",p:"What does this template render?",
c:`{# vlans = [{"id": 30, "name": "PRINT"},
            {"id": 10, "name": "USERS"},
            {"id": 20, "name": "VOICE"}] #}
{% for v in vlans | sort(attribute="id") if v.name != "VOICE" %}
vlan {{ v.id }}
 name {{ v.name | lower }}
{% endfor %}`,
o:["vlan 10 name users, then vlan 30 name print","vlan 30 name print, then vlan 10 name users","vlan 10 name users, vlan 20 name voice, then vlan 30 name print","vlan 10 name USERS, then vlan 30 name PRINT"],
e:"sort(attribute=\"id\") orders by id, the if clause on the for loop skips VOICE, and lower changes the names to lowercase."},

{g:3,t:"3.4",p:"What does this task do?",
c:`- name: Wait for the Catalyst Center task to finish
  ansible.builtin.uri:
    url: "https://{{ cc_host }}/dna/intent/api/v1/task/{{ task_id }}"
    headers:
      X-Auth-Token: "{{ token }}"
  register: task
  until: task.json.response.endTime is defined
  retries: 10
  delay: 5`,
o:["It repeats the GET every 5 seconds until the task has an endTime, giving up after 10 retries","It sends 10 GET requests at once and keeps the first one that has an endTime","It waits 50 seconds, then sends a single GET and fails if endTime is missing","It repeats the GET every 10 seconds until the task has an endTime, giving up after 5 retries"],
e:"until reruns the task until the condition is true, retries sets how many times, and delay sets the seconds between attempts. A Catalyst Center task gets an endTime when it finishes."},

{g:3,t:"3.4",p:"A playbook of cisco.meraki modules with state: present runs twice, with no change to its variables. What should the second run report for those tasks?",
o:["ok, with changed=false, because the Dashboard already matches","changed, because each run sends the same API calls again to the Dashboard","failed, because the objects already exist in the Dashboard","skipped, because Ansible caches the results of the first run"],
e:"Modules compare the desired state with what the API returns and only make calls when they differ. That idempotence makes playbooks safe to rerun."},

{g:3,t:"3.4",p:"How should later uri tasks reuse this SD-WAN Manager session?",
c:`- name: Log in to SD-WAN Manager
  ansible.builtin.uri:
    url: "https://{{ vmanage }}/j_security_check"
    method: POST
    body_format: form-urlencoded
    body:
      j_username: "{{ sdwan_user }}"
      j_password: "{{ sdwan_pass }}"
  register: login`,
o:["Send the header Cookie: \"{{ login.cookies_string }}\", plus X-XSRF-TOKEN on changes","Send the header Authorization: Bearer \"{{ login.json.token }}\" on every request","Send the header X-Auth-Token: \"{{ login.content }}\" on every request","Nothing extra, because uri keeps cookies between tasks automatically"],
e:"j_security_check sets a JSESSIONID cookie, and each uri task is a separate request, so the cookie must be passed on. POST, PUT and DELETE also need the XSRF token."},

{g:3,t:"3.5",p:"Security wants a list of devices whose running configuration has drifted from what Catalyst Center intends. Which API fits?",
o:["GET /dna/intent/api/v1/compliance with complianceStatus=NON_COMPLIANT","GET /dna/intent/api/v1/network-device with reachabilityStatus=Unreachable","GET /dna/intent/api/v1/site-health, filtered on low health scores","GET /dna/intent/api/v1/image/importation, filtered on golden images"],
e:"The compliance API reports status per device and category, including running configuration, images and PSIRTs. Reachability and health don't show configuration drift."},

{g:3,t:"3.5",p:"A script must block one client from a Meraki network. Which call does that?",
o:["PUT /networks/{networkId}/clients/{clientId}/policy with devicePolicy set to Blocked","DELETE /networks/{networkId}/clients/{clientId}, which bans the client","POST /networks/{networkId}/clients/{clientId}/quarantine","PUT /devices/{serial}/switch/ports/{portId} with enabled set to false, for every port"],
e:"The client policy endpoint sets a client to Normal, Whitelisted, Blocked or Group policy. There's no client delete or quarantine call, and disabling ports affects everyone on them."},

{g:3,t:"3.5",y:"m",p:"Which two statements describe ISE pxGrid 2.0? (Choose two.)",
o:["Clients subscribe to topics such as session updates and receive changes as they happen","Clients are approved accounts that discover services over REST and subscribe over WebSocket","It's the ISE REST API for creating endpoints and network devices, and it listens on TCP port 9060","It only works with Cisco products, so other vendors' SIEMs can't use it","It works by polling, so it needs a script that runs every few minutes"],
e:"pxGrid shares context in real time through publish and subscribe. ERS on port 9060 is the configuration API, and many third-party products integrate through pxGrid."},

{g:3,t:"3.6",p:"Why does r.json() fail although the status is 200?",
c:`s = requests.Session()
s.post(f"{base}/j_security_check",
       data={"j_username": user, "j_password": "wrong-pass"}, verify="ca.pem")
r = s.get(f"{base}/dataservice/device", verify="ca.pem")
print(r.status_code)   # 200
r.json()               # JSONDecodeError`,
o:["The login failed, so SD-WAN Manager returned its HTML login page instead of JSON","The device list is too large, so it must be read with stream=True","SD-WAN Manager returns XML unless the Accept header asks for JSON","The XSRF token is missing, which makes every GET request return HTML"],
e:"A failed j_security_check login doesn't raise an error, and later calls get the HTML login page with status 200. Check that the login response body is empty and that a JSESSIONID cookie was set."},

{g:3,t:"3.6",p:"A Catalyst Center script raises SSLError: CERTIFICATE_VERIFY_FAILED. The controller's certificate comes from the company's internal CA. What's the right fix?",
o:["Pass the internal CA bundle with verify=\"corp-ca.pem\", or add the CA to the trust store","Set verify=False on every request, which is safe on internal networks","Change the base URL to http:// so no certificate is needed","Get a new token, because expired tokens cause certificate errors"],
e:"The client won't trust the internal CA until it's given that CA. Turning off verification exposes credentials to interception, and an expired token gives 401, not a TLS error."},

{g:4,t:"4.1",p:"In what order does AEtest run these sections?",
c:`from pyats import aetest

class CommonSetup(aetest.CommonSetup):
    @aetest.subsection
    def connect(self, testbed):
        # Purpose: connect to every device once before testing
        testbed.connect()

class BgpCheck(aetest.Testcase):
    @aetest.test
    def neighbors_up(self, testbed):
        # Purpose: fail if any BGP neighbor isn't established
        ...

class CommonCleanup(aetest.CommonCleanup):
    @aetest.subsection
    def disconnect(self, testbed):
        # Purpose: close every connection after testing
        for d in testbed.devices.values():
            d.disconnect()`,
o:["CommonSetup, then BgpCheck, then CommonCleanup","BgpCheck, then CommonSetup, then CommonCleanup","Alphabetically by class: BgpCheck, CommonCleanup, then CommonSetup","BgpCheck only, because setup and cleanup sections must be called by hand"],
e:"AEtest always runs CommonSetup first and CommonCleanup last, with the Testcases in between in the order they're defined."},

{g:4,t:"4.1",p:"What does dev.parse() return here?",
c:`out = dev.parse("show ip ospf neighbor")
for intf, data in out["interfaces"].items():
    for nbr, info in data["neighbors"].items():
        print(intf, nbr, info["state"])`,
o:["A nested dict from a Genie parser, so fields are read by key","The raw CLI text, split into a list of lines","An XML element tree read from the device over NETCONF","A pandas DataFrame with one row for each OSPF neighbor and one column for each field"],
e:"Genie parsers turn show output into dictionaries that follow a schema, so scripts don't need their own screen scraping. The connection is still the CLI."},

{g:4,t:"4.2",p:"Automation tools on the corporate network must reach routers running in a CML lab. Which CML feature provides that?",
o:["An external connector node, in bridge or NAT mode","An unmanaged switch node, which forwards lab traffic to the internet","A pyATS node placed inside the lab, which proxies traffic into it","Nothing, because CML lab devices are always reachable from the LAN"],
e:"External connectors link a lab to the outside network in bridge or NAT mode. Unmanaged switches only connect nodes inside the lab."},

{g:4,t:"4.2",y:"o",p:"Put the steps of a CI pipeline that tests a change in a CML lab in order.",
s:["Wait until the nodes have booted and the routing has converged","Stop, wipe and remove the lab","Import the topology and start the lab","Run the pyATS tests against the lab devices"],
o:["3, 1, 4, 2","1, 3, 4, 2","3, 4, 1, 2","3, 1, 2, 4"],
e:"Tests only make sense once the nodes have converged, and the lab is removed at the end so it doesn't hold resources."},

{g:4,t:"4.3",p:"A golden image has been distributed to a group of switches through Catalyst Center. Which API call installs it and reloads them?",
o:["POST /dna/intent/api/v1/image/activation/device","POST /dna/intent/api/v1/image/distribution","POST /dna/intent/api/v1/image/importation/source/url","PUT /dna/intent/api/v1/network-device/sync"],
e:"Activation installs the image and reloads the device, usually in a scheduled window. Importation loads the image into the repository, distribution copies it to devices, and sync only refreshes inventory."},

{g:4,t:"4.3",p:"An SD-WAN Manager software upgrade request returns an action ID. How does a script find out whether the upgrade worked?",
o:["Poll GET /dataservice/device/action/status/{id} until the action finishes","Wait for the edge to reboot, because the Manager has no status API for upgrades","Read the ID as the new software version that the edge router is now running","Call GET /dataservice/client/token with the ID to read the action log"],
e:"Device actions such as upgrades run asynchronously, and the action status endpoint reports their progress and result for each device."},

{g:4,t:"4.4",p:"A dashboard needs counts of healthy and poor wired and wireless clients across the network from Catalyst Center. Which API fits?",
o:["GET /dna/intent/api/v1/client-health","GET /dna/intent/api/v1/network-device","GET /dna/intent/api/v1/client-detail","GET /dna/intent/api/v1/topology/physical-topology"],
e:"client-health returns overall scores and counts by client type. client-detail covers one client by MAC address, and the others return inventory and topology."},

{g:4,t:"4.4",p:"Users report slow access to a SaaS application from one branch. Which platform's API can show where along the path the latency and loss appear?",
o:["ThousandEyes, from agent-to-server test results","Catalyst Center's site-health API, which measures internet paths hop by hop","Meraki's device statuses API, which reports latency to every SaaS application","pyATS, which learns the SaaS provider's routing tables"],
e:"ThousandEyes agents test toward the application and report path visualization with per-hop latency and loss, including across networks you don't own."},

{g:4,t:"4.5",p:"What does update-policy on-change do in this subscription?",
c:`telemetry ietf subscription 210
 encoding encode-kvgpb
 filter xpath /interfaces-ios-xe-oper:interfaces/interface/oper-status
 stream yang-push
 update-policy on-change
 receiver ip address 10.9.0.50 57000 protocol grpc-tcp`,
o:["It sends an update when an interface's oper-status changes, instead of on a timer","It sends the whole interface table whenever any configuration changes","It turns the subscription on only after the receiver's address changes","It sends updates on a fixed default period of 5 seconds"],
e:"On-change subscriptions push data when the value changes, and only work for paths that support on-change. Periodic subscriptions use update-policy periodic with an interval in centiseconds."},

{g:4,t:"4.5",p:"A configured telemetry subscription is created over RESTCONF with the Cisco-IOS-XE-mdt-cfg model instead of the CLI. How does it behave?",
o:["Like a CLI one: it's saved in the running configuration and dials out to its receiver","Like a dynamic subscription: it ends when the RESTCONF request completes","It streams the data back in the RESTCONF response instead of to a receiver","It can only use NETCONF as the transport for its telemetry updates"],
e:"The CLI, NETCONF and RESTCONF all edit the same configuration, so the subscription persists and dials out. Only establish-subscription creates a dynamic, session-bound subscription."},

{g:4,t:"4.6",y:"o",p:"Put the steps of Meraki webhook alerting in order.",
s:["Register the receiver's URL and shared secret as a webhook server in the network","An alert condition occurs, and Meraki POSTs the payload to the receiver","Add the webhook server as a recipient for the chosen alerts","The receiver checks the shared secret, then processes the alert"],
o:["1, 3, 2, 4","3, 1, 2, 4","1, 2, 3, 4","1, 3, 4, 2"],
e:"Alerts can only target a webhook server once it's registered, and the receiver only gets payloads for alerts it's a recipient of."},

{g:4,t:"4.6",y:"m",p:"A Catalyst Center webhook receiver takes 30 seconds to process each event, and some events arrive twice. Which two changes help? (Choose two.)",
o:["Return a 2xx response at once, and process the event from a queue","Record each event's ID, and skip any event already processed","Return 500 after processing, so the controller knows it was handled","Change the destination to http://, so the controller can send faster","Ask Catalyst Center to send all events in one daily batch instead"],
e:"Senders retry when a reply is slow or missing, which causes duplicates. Acknowledge quickly, process asynchronously, and make processing idempotent by event ID."},

{g:5,t:"5.1",p:"What does AI Endpoint Analytics in Catalyst Center do?",
o:["It classifies endpoints using telemetry and ML, and can share the labels with ISE for policy","It writes switch configuration for new endpoints and pushes it without review","It predicts hardware failures from each switch's age and the warranty data in inventory","It replaces 802.1X by letting endpoints join once they're classified"],
e:"Endpoint Analytics profiles devices from many signals, including deep packet inspection and ML grouping, so policy can depend on what a device is. It doesn't replace authentication or change configuration by itself."},

{g:5,t:"5.1",y:"m",p:"Which two are realistic uses of AI in controller-based platforms such as Catalyst Center, Meraki and ThousandEyes? (Choose two.)",
o:["Learning normal behavior and raising issues when metrics deviate from it","Answering natural-language questions about the network from controller data","Guaranteeing that no outages occur, so change windows and rollback plans aren't needed","Predicting device state without any telemetry, so collection can stop","Giving the assistant more rights than the admin who's using it"],
e:"Baselining with anomaly detection, and assistants that query controller data, are common features. They still depend on telemetry and the user's permissions, and they don't guarantee uptime."},

{g:5,t:"5.2",p:"An AI assistant generated this function. What should a reviewer require before it's used?",
c:`def push_vlan(host, vlan):
    # Purpose: create a VLAN through RESTCONF
    url = f"https://{host}/restconf/data/Cisco-IOS-XE-native:native/vlan"
    return requests.patch(url, auth=("admin", "Cisco123!"), verify=False,
                          headers=HDRS, json=vlan_body(vlan))`,
o:["Load credentials from a vault or environment, and verify TLS with the device CA","Nothing, because the assistant tested the code before it showed it","Replace PATCH with PUT, because PUT is always safer for VLAN changes","Add a comment saying the code was AI-generated, so that it's safe to run"],
e:"Hard-coded credentials and verify=False are common in generated code. Review it as you would code from any other author, then test it in a lab."},

{g:5,t:"5.2",p:"How can a team validate an AI-generated function that parses show output, without touching any devices?",
o:["Write unit tests that feed it saved outputs and check the parsed results","Ask the same assistant whether the function is correct, and accept a yes","Run it once in production during a quiet period and watch for errors","Check that the code runs without syntax errors, which shows that it parses correctly"],
e:"Saved outputs, including edge cases, make tests repeatable and safe. Asking the model to grade its own work, or only checking syntax, doesn't show the logic is right."},

{g:5,t:"5.3",y:"m",p:"An engineer wants to add a third-party MCP server found online to an agent that holds Catalyst Center credentials. Which two controls reduce the risk? (Choose two.)",
o:["Review the server's code and pin a known version before installing it","Give it separate read-only credentials and limit its network access","Share the agent's admin token with it, so it never fails for missing rights","Trust its tool descriptions, since they come from the server's own author","Let it update itself to the newest version on every start, for its fixes"],
e:"A malicious or compromised server can steal credentials or hide instructions in its tool descriptions (tool poisoning). Vet and pin it, and limit what it can reach."},

{g:5,t:"5.3",p:"An AI troubleshooting assistant answers from an internal wiki that anyone can edit, and engineers act on its advice. What's the main risk?",
o:["Someone can plant false or harmful steps in the wiki, which the assistant repeats","The wiki's pages will make the model respond more slowly than usual","The assistant will refuse to answer questions that the wiki doesn't cover","The wiki will use up the model's licence quota faster than device data does"],
e:"This is data poisoning of the assistant's knowledge source. Control who can edit it, review changes, and keep people verifying actions."},

{g:5,t:"5.4",p:"How does an AI client use this?",
c:`@mcp.resource("inventory://{site}/devices")
def site_devices(site: str) -> list[dict]:
    """List the devices at one site."""
    # Purpose: return the device list for one site
    return lookup_site(site)`,
o:["It reads a URI such as inventory://akl/devices, and FastMCP passes akl as site","It calls site_devices as a tool, with site in the tool's arguments","It reads inventory://{site}/devices literally, which returns every site at once","It can't, because MCP resources can't take any parameters"],
e:"A URI with placeholders makes a resource template. The values in the URI are passed to the matching function parameters, and the result comes back as resource content."},

{g:5,t:"5.4",p:"A FastMCP server must be reachable by agents running on other machines. How should it be run?",
o:["mcp.run(transport=\"http\", port=8000), behind TLS and authentication","mcp.run() with the default stdio transport, with its port opened in the firewall","mcp.run(transport=\"stdio\", port=8000), which listens on the network","As a cron job that writes tool results to a shared folder"],
e:"stdio connects one local client that starts the server as a subprocess. HTTP (streamable HTTP) serves remote clients, and it should be protected like any other API."},

{g:5,t:"5.4",p:"Which arguments appear in this tool's input schema for the AI client?",
c:`from fastmcp import FastMCP, Context

mcp = FastMCP("netops")

@mcp.tool()
async def ping_device(host: str, ctx: Context) -> str:
    """Ping a device from the automation server."""
    # Purpose: ping one device and report the result
    await ctx.info(f"pinging {host}")
    return await run_ping(host)`,
o:["Only host, because FastMCP injects ctx and leaves it out of the schema","host and ctx, so the client has to build a Context object and send it with each call","None, because async tools don't publish an input schema","Only ctx, because host is read from the docstring"],
e:"FastMCP recognizes the Context type hint and fills it in at call time, giving the tool logging and progress methods. Only the other parameters become tool arguments."}
];
