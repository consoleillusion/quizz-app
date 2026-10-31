// Questions for practice quiz 6 (exam difficulty). Correct option(s) are written first; mk.js shuffles them.
module.exports = [
{g:1,t:"1.1",p:"Which statement describes the config and state containers used throughout OpenConfig models?",
o:["config holds the intended values a client sets, and state repeats those leaves as applied values plus operational counters",
"config holds the running configuration, and state holds the startup configuration saved on the device",
"config is used over NETCONF, and state is used over RESTCONF, so each protocol reads a different container",
"config and state are alternatives in a YANG choice, so each node holds either configuration or operational data, never both at once"],
e:"OpenConfig separates intended configuration (config, read-write) from what the device has applied and reports (state, read-only). Comparing the two shows whether a change has taken effect."},

{g:1,t:"1.2",y:"x",p:"Match each part of a NETCONF exchange with the protocol layer it belongs to.",
s:["SSH on TCP port 830","<rpc> and <rpc-reply> elements","<edit-config> and <get-config>","Configuration data structured by YANG models"],
r:["Content","Operations","Messages","Secure transport"],
o:["1-d, 2-c, 3-b, 4-a","1-d, 2-b, 3-c, 4-a","1-c, 2-d, 3-b, 4-a","1-d, 2-c, 3-a, 4-b"],
e:"RFC 6241 layers NETCONF as secure transport, messages (rpc, rpc-reply, notification), operations (get-config, edit-config and so on), and content, which YANG models define."},

{g:1,t:"1.3",p:"ietf-ip augments ietf-interfaces. Which body for PUT /restconf/data/ietf-interfaces:interfaces/interface=Loopback20 sets 10.20.0.1/32?",
c:`module: ietf-interfaces
  +--rw interfaces
     +--rw interface* [name]
        +--rw name                 string
        +--rw type                 identityref
        +--rw ip:ipv4!
           +--rw ip:enabled?   boolean
           +--rw ip:address* [ip]
              +--rw ip:ip                 inet:ipv4-address-no-zone
              +--rw (ip:subnet)
                 +--:(ip:prefix-length)
                    +--rw ip:prefix-length?   uint8`,
o:["{\"ietf-interfaces:interface\": [{\"name\": \"Loopback20\", \"type\": \"iana-if-type:softwareLoopback\", \"ietf-ip:ipv4\": {\"address\": [{\"ip\": \"10.20.0.1\", \"prefix-length\": 32}]}}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback20\", \"type\": \"iana-if-type:softwareLoopback\", \"ipv4\": {\"address\": [{\"ip\": \"10.20.0.1\", \"prefix-length\": 32}]}}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback20\", \"type\": \"iana-if-type:softwareLoopback\", \"ietf-ip:ipv4\": {\"address\": {\"ip\": \"10.20.0.1\", \"prefix-length\": 32}}}]}",
"{\"ietf-interfaces:interface\": [{\"name\": \"Loopback20\", \"type\": \"iana-if-type:softwareLoopback\", \"ietf-ip:ipv4\": {\"address\": [{\"ip\": \"10.20.0.1\", \"ip:prefix-length\": 32}]}}]}"],
e:"ipv4 comes from a different module than interface, so it's prefixed with the module name, ietf-ip. Its children share its module and stay unprefixed. address is a list, so it's an array, and tree prefixes such as ip: never appear in JSON."},

{g:1,t:"1.4",p:"Which pyang output format gives an XML instance skeleton of a module that you can fill in to build an edit-config payload?",
o:["-f sample-xml-skeleton","-f yin, which writes the module out as XML so it can be edited into an instance payload","-f tree","-f jstree"],
e:"sample-xml-skeleton prints empty instance XML in the module's namespace. yin is the YANG module itself written as XML, which is a schema, not data. tree and jstree only show structure."},

{g:1,t:"1.5",p:"What does the x at the start of the interfaces-state lines mean?",
c:`module: ietf-interfaces
  +--rw interfaces
  |  +--rw interface* [name]
  |     +--rw name            string
  |     +--ro oper-status     enumeration
  x--ro interfaces-state
     x--ro interface* [name]
        x--ro name            string
        x--ro oper-status     enumeration`,
o:["Those nodes have status deprecated, so new code should read state from interfaces instead","Those nodes are RPCs, which are invoked with POST","Those nodes are actions, which run on a single list entry","Those nodes aren't supported on this particular device, as declared in a deviation module that the device publishes"],
e:"The first character of each line is the status: + current, x deprecated, o obsolete. RPCs and actions show -x after the status, as +---x. ietf-interfaces moved state into interfaces when it adopted NMDA."},

{g:1,t:"1.5",y:"m",p:"Which two statements about this tree are true? (Choose two.)",
c:`module: example-vrf
  +--rw vrfs
     +--rw vrf* [name]
        +--rw name           string
        +--rw rd?            string
        +--rw import-rt*     string
        +--ro route-count?   uint32
        +--rw description?   string`,
o:["import-rt can hold several string values for each VRF","route-count can be read, for example with content=nonconfig, but never set","rd is mandatory, because a VRF can't work without a route distinguisher","import-rt is a list, so each of its entries needs its own key leaf","route-count can be set to 0 to clear a VRF's routing table"],
e:"* without brackets marks a leaf-list of values, and ro marks state data that can't be configured. rd has ? and is optional in this model, whatever the protocol needs."},

{g:2,t:"2.1",p:"A script must manage a mixed fleet whose platforms aren't recorded anywhere. How can Netmiko pick the right device_type?",
o:["Use SSHDetect(**dev).autodetect() and pass the result as device_type","Set device_type=\"autodetect\" in ConnectHandler, which then picks the platform itself for each command","Set device_type=\"generic\", which works the same way as the platform drivers","Leave device_type out, and Netmiko reads the platform from the SSH banner"],
e:"SSHDetect connects with the autodetect type, runs probe commands and returns the best match, such as cisco_xe. ConnectHandler needs a concrete type, and generic lacks the platform's prompt and paging handling."},

{g:2,t:"2.1",p:"The switches are only reachable through a bastion host. How can Netmiko reach them?",
o:["Pass ssh_config_file pointing to an SSH config that sets ProxyJump or ProxyCommand for those hosts","Pass the bastion's address as host and the switch's address as secret","Set fast_cli=False, which lets Netmiko forward the session through the bastion","Run send_command(\"ssh switch\") on a session to the bastion, which Netmiko does for every device type"],
e:"Netmiko can read an OpenSSH config file, so a proxy defined there is used for the connection. Driving a second SSH from the bastion's shell works poorly, because the prompts and device type no longer match."},

{g:2,t:"2.2",p:"A monitoring script must receive NETCONF event notifications as they occur. Which ncclient calls fit?",
o:["m.create_subscription(), then m.take_notification() in a loop","m.get() in a loop every second, comparing each reply with the last","m.edit_config() with a notification element, then m.get_config()","m.dispatch(\"listen\"), then m.close_session() to flush events"],
e:"create-subscription (RFC 5277) starts an event stream on the session, and take_notification blocks until the next notification arrives. Polling with get isn't event-driven."},

{g:2,t:"2.2",p:"What does device_params={\"name\": \"iosxe\"} do in this call?",
c:`m = manager.connect(host="10.0.0.11", port=830,
                    username=user, password=pw,
                    hostkey_verify=False,
                    device_params={"name": "iosxe"})`,
o:["It loads ncclient's IOS XE device handler, for vendor-specific capabilities and behavior","It selects Cisco-IOS-XE-native as the default model for every RPC sent on this session, so payloads need no namespace","It sets the session to exchange JSON instead of XML with the device","It tells the device to start its NETCONF agent if it isn't running"],
e:"Device handlers adjust ncclient for a platform, for example extra capabilities or RPCs. The protocol stays XML over SSH, and models are chosen by the namespaces in each payload."},

{g:2,t:"2.3",p:"In the native model, static routes are a list keyed by prefix and mask. Which URL reads the route to 10.0.0.0/8?",
o:["/restconf/data/Cisco-IOS-XE-native:native/ip/route/ip-route-interface-forwarding-list=10.0.0.0,255.0.0.0","/restconf/data/Cisco-IOS-XE-native:native/ip/route/ip-route-interface-forwarding-list=10.0.0.0/255.0.0.0","/restconf/data/Cisco-IOS-XE-native:native/ip/route/ip-route-interface-forwarding-list=10.0.0.0%2F8","/restconf/data/Cisco-IOS-XE-native:native/ip/route/ip-route-interface-forwarding-list?prefix=10.0.0.0&mask=255.0.0.0"],
e:"RESTCONF separates multiple key values with commas, in the order the keys are defined. A slash would start a new path segment, and keys never go in the query string."},

{g:2,t:"2.3",p:"Which expression returns the five-minute CPU average?",
c:`url = f"{base}/data/Cisco-IOS-XE-process-cpu-oper:cpu-usage/cpu-utilization"
r = requests.get(url, auth=auth, verify="corp-ca.pem",
                 headers={"Accept": "application/yang-data+json"})
# Reply begins: {"Cisco-IOS-XE-process-cpu-oper:cpu-utilization": {"five-seconds": 3, ...
cpu = ________`,
o:["r.json()[\"Cisco-IOS-XE-process-cpu-oper:cpu-utilization\"][\"five-minutes\"]","r.json()[\"Cisco-IOS-XE-process-cpu-oper:cpu-usage\"][\"cpu-utilization\"][\"five-minutes\"]","r.json()[\"cpu-utilization\"][\"five-minutes\"]","r.json()[\"Cisco-IOS-XE-process-cpu-oper:cpu-utilization\"][\"Cisco-IOS-XE-process-cpu-oper:five-minutes\"]"],
e:"The reply's single member is the requested node, qualified with its module, not its parent. Children in the same module have no prefix."},

{g:2,t:"2.3",p:"A pipeline makes Loopback30 exactly match a stored body, and it must be safe to rerun. Which method fits?",
o:["PUT to the interface's URL, which creates or replaces it the same way every time","POST to the interfaces list, which creates the interface on every run","PATCH to the interface's URL, which merges the body and leaves any extra settings","DELETE followed by POST, which recreates the interface on every run"],
e:"PUT is idempotent and replaces the target, so repeated runs give the same state (201, then 204). POST fails on the second run, PATCH can leave drift behind, and delete-then-create causes an outage each time."},

{g:2,t:"2.4",p:"Which Ansible module pushes a YANG XML payload to IOS XE over NETCONF?",
o:["ansible.netcommon.netconf_config, with connection: ansible.netcommon.netconf","cisco.ios.ios_config, with src pointing to the XML file, which it converts into an edit-config RPC","ansible.netcommon.netconf_get, with the payload as its filter","ansible.builtin.uri, with the payload as the body"],
e:"netconf_config sends edit-config with the given content over a NETCONF connection. ios_config is a CLI module, netconf_get only reads, and uri speaks HTTP."},

{g:2,t:"2.4",p:"What does this task do?",
c:`- name: Clean up VLANs
  cisco.ios.ios_vlans:
    state: deleted`,
o:["It deletes every VLAN configured on the switch, because no config list is given","It deletes nothing, because there's no config list naming which VLANs to delete","It deletes only VLANs that no interface currently uses","It deletes the VLANs that a previous run created"],
e:"For resource modules, deleted with no config removes all configuration of that resource, except platform defaults such as VLAN 1. Listing VLANs limits the deletion to them."},

{g:2,t:"2.5",p:"A ZTP setup serves the script from a TFTP server rather than a URL. Which DHCP options must the pool provide?",
o:["Option 150 with the TFTP server's address, and option 67 with the script's file name","Option 43 with the TFTP server's address, and option 67 with the script's file name","Option 150 with the TFTP server's address, and option 43 with the script's file name","Option 67 alone, with the server and file name joined by a colon"],
e:"Option 150 gives Cisco devices the TFTP server, and option 67 names the file. Option 43 is the vendor option that PnP uses, and option 67 alone needs a full URL."},

{g:2,t:"2.5",p:"A router boots with no configuration and gets a DHCP address with option 150, but no option 67. Which files does IOS AutoInstall request over TFTP?",
o:["A network-wide file such as network-confg, then a host-specific file such as <hostname>-confg","A Python script named ztp.py, which it runs in Guest Shell","The startup-config file of the TFTP server itself","Nothing, because AutoInstall needs Catalyst Center or a DHCP bootfile option to tell it which file names to request"],
e:"Without a bootfile, AutoInstall tries default names: a network config to learn its hostname, then a host-specific config. ZTP's Python script is only used when option 67 names it."},

{g:2,t:"2.6",p:"HTTPS to the switch works, but every RESTCONF URL, including /restconf itself, returns 404. What's the most likely cause?",
o:["The restconf command isn't configured, so the HTTPS server has no RESTCONF resources","The user lacks privilege 15, so RESTCONF hides its resources","The Accept header asks for JSON, which this switch doesn't support","The URLs aren't percent-encoded, so the server can't find them"],
e:"The web server answers, but nothing is registered under /restconf until restconf is enabled. Missing rights give 401 or 403, and an unsupported media type gives 406 or 415."},

{g:2,t:"2.6",p:"A NETCONF commit fails with this error. What's wrong?",
c:`<rpc-error>
  <error-type>application</error-type>
  <error-tag>data-missing</error-tag>
  <error-severity>error</error-severity>
  <error-app-tag>instance-required</error-app-tag>
  <error-path>/lags/lag[id='1']/member</error-path>
</rpc-error>

Tree:  +--rw member*   -> /if:interfaces/interface/name`,
o:["A member value names an interface that doesn't exist, which the leafref doesn't allow","The member leaf-list is mandatory, and the payload left it empty","The lag entry already exists, so it can't be created again","Another NETCONF session holds a lock on the candidate datastore, so the member values can't be saved yet"],
e:"instance-required is the error-app-tag for a leafref whose target doesn't exist. Create the interface first, or correct the name."},

{g:2,t:"2.7",y:"x",p:"Match each EEM event detector with when it triggers the applet.",
s:["event syslog pattern \"LINK-3-UPDOWN\"","event timer cron cron-entry \"30 6 * * 1-5\"","event track 20 state down","event none"],
r:["At 06:30 on weekdays","Only when run with event manager run","When a matching log message is generated","When tracked object 20 goes down"],
o:["1-c, 2-a, 3-d, 4-b","1-c, 2-a, 3-b, 4-d","1-a, 2-c, 3-d, 4-b","1-c, 2-d, 3-a, 4-b"],
e:"Each detector watches a different source. event none has no trigger of its own, so the applet runs only when invoked by name, which suits on-demand tools."},

{g:2,t:"2.7",p:"Why does action 2.0 include pattern \"confirm\"?",
c:`event manager applet CLEAR-COUNTERS
 event timer cron cron-entry "0 0 * * 1"
 action 1.0 cli command "enable"
 action 2.0 cli command "clear counters" pattern "confirm"
 action 3.0 cli command "y"`,
o:["clear counters asks for confirmation, so EEM waits for that prompt instead of the router prompt, and action 3.0 answers it","pattern filters the command's output, so only lines containing the word confirm are kept in $_cli_result for action 3.0 to read","pattern makes the applet run only when the word confirm appears in the log","pattern runs the command in confirm mode, so action 3.0 is ignored"],
e:"By default an EEM cli action waits for the exec prompt. pattern tells it to stop at a different prompt, so the next action can reply."},

{g:3,t:"3.1",y:"o",p:"Put the steps that let a Catalyst Center PnP claim apply a Day-0 template in order.",
s:["Commit the template","Claim the device to a site with the template and its variable values","Create a project in Onboarding Configuration","Create the template, with variables, inside that project"],
o:["3, 4, 1, 2","4, 3, 1, 2","3, 1, 4, 2","3, 4, 2, 1"],
e:"PnP templates live in Onboarding Configuration projects, and only committed versions can be used, so the claim comes last."},

{g:3,t:"3.1",p:"A new MX must use a static WAN address, because the site has no DHCP on the uplink. How can this be set before the MX arrives?",
o:["PUT /devices/{serial}/managementInterface with wan1 set to a static address, gateway and DNS","PUT /networks/{networkId}/appliance/vlans with the WAN address, gateway and DNS servers set on VLAN 1 for the uplink","POST /networks/{networkId}/devices/claim with the IP address in the body","PUT /networks/{networkId}/appliance/uplinks/settings on the switch at the site"],
e:"The management interface settings for an MX's uplinks can be set on the serial ahead of time, so the device uses them when it boots. VLAN settings cover the LAN side."},

{g:3,t:"3.1",p:"In the Plug and Play Connect portal, what tells a new Catalyst SD-WAN edge which overlay to join?",
o:["The controller profile assigned to the device, which holds the Validator's address and the organization name","The device's serial number, which encodes the address of its Validator","A DHCP option 43 string configured inside the portal for the device","The device template attached in SD-WAN Manager, which the portal copies to the device along with its certificate and serial"],
e:"PnP Connect redirects the device using its controller profile. The Validator then authenticates it, and the organization name must match the overlay's."},

{g:3,t:"3.2",p:"A Catalyst Center API returns executionId and executionStatusUrl instead of a taskId. What should the script do?",
o:["Poll the executionStatusUrl until its status is SUCCESS or FAILURE, then check bapiError if it failed","Treat executionId as a taskId, and poll /dna/intent/api/v1/task/{executionId} until isError and endTime appear","Wait for a webhook, because executions can't be polled","Treat the change as complete, because executionId is only returned on success"],
e:"Business APIs return an execution, tracked at /dna/platform/management/business-api/v1/execution-status/{executionId}. Its status and error fields report the outcome."},

{g:3,t:"3.2",p:"A script calls GET /networks/{networkId}/devices for each of 300 networks to collect switch serials, and keeps hitting 429. What's the better design?",
o:["One paginated GET /organizations/{organizationId}/devices with productTypes[]=switch","The same per-network calls, made in 20 parallel threads","The same per-network calls, made with a second API key","GET /organizations/{organizationId}/inventory/devices once, with perPage set high enough to skip pagination"],
e:"Organization-wide endpoints return everything in a few paged calls instead of hundreds. The rate limit is per organization, so threads and extra keys make it worse."},

{g:3,t:"3.2",p:"A script logs in to SD-WAN Manager every minute and never logs out. After some hours, new logins start failing. What's the fix?",
o:["Reuse one session, or call logout after each run so sessions don't pile up","Log in twice each time, because the first login always times out","Send the password in a header on each request instead of logging in","Disable XSRF checking, which is what blocks the new logins"],
e:"SD-WAN Manager limits concurrent sessions per user, and abandoned sessions count until they expire. Reuse or close them."},

{g:3,t:"3.2",p:"A script needs the live session details for one endpoint MAC, such as the NAS IP, switch port and authorization result. Which ISE API fits?",
o:["The Monitoring (MnT) API session lookup by MAC address","The ERS endpoint API, which stores session details on each endpoint","The ERS network device API, filtered by the endpoint's MAC","The pxGrid ANC topic, read once for the MAC"],
e:"MnT exposes active session data, such as /admin/API/mnt/Session/MACAddress/{mac}. ERS holds configuration objects, not live sessions, and pxGrid ANC covers quarantine actions."},

{g:3,t:"3.3",p:"What priorities does this render for the three VLANs?",
c:`{# vlans = [10, 20, 30] #}
{% for v in vlans %}
interface Vlan{{ v }}
 standby {{ v }} priority {{ loop.cycle(110, 100) }}
{% endfor %}`,
o:["110, 100, 110","110, 100, 100","100, 110, 100","110, 110, 110"],
e:"loop.cycle steps through its arguments, one per iteration, and starts again at the first when it runs out."},

{g:3,t:"3.3",p:"What does this line render?",
c:`{# ports = [{"id": 20}, {"id": 10}, {"id": 20}, {"id": 30}, {"id": 10}] #}
switchport trunk allowed vlan {{ ports | map(attribute="id") | unique | sort | join(",") }}`,
o:["switchport trunk allowed vlan 10,20,30","switchport trunk allowed vlan 20,10,30","switchport trunk allowed vlan 10,10,20,20,30","switchport trunk allowed vlan 30,20,10"],
e:"map takes the ids, unique drops repeats, sort orders the numbers ascending, and join builds the string."},

{g:3,t:"3.3",p:"What does this render?",
c:`{# block = "ip address 10.1.1.1 255.255.255.0\\nno shutdown" #}
interface Gi1/0/1
 {{ block | indent(1) }}`,
o:["Both lines indented by one space, because the template supplies the first line's space","Only the first line indented, because indent skips the lines after it","Both lines indented by two spaces, because indent adds to the template's space","Neither line indented, because indent needs first=True"],
e:"indent indents every line except the first by default (first=False). Here the template's own space covers the first line, so both lines end up one space in."},

{g:3,t:"3.4",p:"A cisco.meraki task fails with an error saying the meraki SDK can't be imported. What's the fix?",
o:["Install the meraki Python package in the interpreter Ansible uses on the control node","Install the meraki package on each Meraki device","Change the connection to network_cli, so the module talks to the Dashboard through the devices instead of the SDK","Add the API key to the inventory, which loads the SDK"],
e:"The collection's modules run locally and call the Dashboard through the meraki SDK, so it must be installed in the control node's Python, the one ansible_python_interpreter points to for localhost."},

{g:3,t:"3.4",p:"What does delegate_to: localhost do in this play?",
c:`- hosts: switches
  gather_facts: false
  tasks:
    - name: Look up each switch in Catalyst Center
      ansible.builtin.uri:
        url: "https://{{ cc_host }}/dna/intent/api/v1/network-device?managementIpAddress={{ ansible_host }}"
        headers: {X-Auth-Token: "{{ token }}"}
      delegate_to: localhost
      register: cc_dev`,
o:["It runs the API call on the control node once for each switch, using that switch's variables","It runs the API call once in total, on the control node, for the first switch only","It runs the API call on each switch, which then forwards it to Catalyst Center","It runs the call on each switch, then copies each registered result back to localhost so later tasks can read it"],
e:"Delegation changes where the task runs, not which host's variables it uses, so ansible_host and cc_dev belong to each switch in turn. run_once would limit it to one run."},

{g:3,t:"3.4",p:"A playbook creates a Catalyst Center site with uri, but every rerun fails because the site already exists. What makes it idempotent?",
o:["GET the site by name first, register the result, and POST only when it isn't found","Add ignore_errors: true to the POST task, so reruns don't fail","Use PUT instead of POST, because PUT creates the site the first time and updates it, without error, on every rerun","Add retries: 3 to the POST task, so a later attempt succeeds"],
e:"uri has no idea of desired state, so the playbook must check first. ignore_errors hides real failures too."},

{g:3,t:"3.5",p:"Which ERS request sets the SGACL that applies from source group Contractors to destination group Servers?",
o:["POST /ers/config/egressmatrixcell with sourceSgtId, destinationSgtId and the SGACL IDs","POST /ers/config/sgacl with the two groups' names in its description","PUT /ers/config/sgt/{id} on the Contractors group, with the Servers group and the SGACL added to its definition","POST /ers/config/ancpolicy with the source and destination groups"],
e:"Each cell of the TrustSec egress matrix links a source SGT, a destination SGT and the SGACLs between them. An SGACL on its own isn't bound to any pair of groups."},

{g:3,t:"3.5",p:"Compliance requires every enabled SSID to use WPA2-Enterprise with an external RADIUS server. Which expression lists the SSIDs that break the rule?",
c:`ssids = dashboard.wireless.getNetworkWirelessSsids(net_id)
bad = ________`,
o:["[s[\"name\"] for s in ssids if s[\"enabled\"] and s[\"authMode\"] != \"8021x-radius\"]","[s[\"name\"] for s in ssids if s[\"authMode\"] != \"8021x-radius\"]","[s[\"name\"] for s in ssids if s[\"enabled\"] and s[\"encryptionMode\"] != \"8021x-radius\"]","[s[\"name\"] for s in ssids if s[\"enabled\"] and s[\"authMode\"] == \"psk\"]"],
e:"The API returns every SSID slot, including disabled ones, so filtering on enabled avoids false alarms. authMode holds the authentication type, and checking only for psk would miss open SSIDs."},

{g:3,t:"3.5",p:"Branches in a Catalyst SD-WAN service VPN must reach only the data center hubs, not each other. Which policy type does that?",
o:["A centralized control policy that limits which routes and TLOCs are advertised to the branches","A centralized data policy on the branches that drops branch-to-branch traffic once it arrives over the overlay","A localized ACL on each branch's LAN interface that denies the other branches' subnets","A QoS policy that sets branch-to-branch traffic to the lowest priority"],
e:"Control policies shape the overlay's topology on the Controllers, so branches never learn each other's routes. Data policies and ACLs filter traffic after the paths already exist."},

{g:3,t:"3.6",p:"A Catalyst Center script works from a laptop but times out from a CI runner that has HTTPS_PROXY set. What's the likely fix?",
o:["Add the controller to NO_PROXY, or set trust_env=False on the requests session","Set verify=False, because the CI runner's proxy re-signs the certificate and that's what causes the timeout","Raise the request timeout to 300 seconds","Switch to http:// to bypass the proxy"],
e:"requests honors proxy environment variables, so internal calls go through a proxy that can't reach the controller. Exclude internal hosts rather than weakening TLS."},

{g:3,t:"3.6",y:"m",p:"Several integrations call the Meraki API for one organization, and all of them see frequent 429s. Which two changes help? (Choose two.)",
o:["Honor Retry-After and back off before retrying","Cut call volume with organization-wide endpoints and action batches","Give each integration its own API key, which brings its own rate limit","Send requests from more threads, so the queue drains faster","Set verify=False, which skips the TLS handshake and lowers load"],
e:"The rate limit applies per organization, whatever keys are used, so the integrations share it. Backing off and making fewer, larger calls are what reduce the 429s."},

{g:4,t:"4.1",y:"m",p:"Which two keep device passwords out of a pyATS testbed file stored in Git? (Choose two.)",
o:["password: \"%ENV{LAB_PASS}\", read from the environment","password: \"%ASK{}\", which prompts at run time","password written in base64, which pyATS decodes","password in a YAML comment, which pyATS ignores","password on the same line as the device name"],
e:"pyATS resolves %ENV{} from environment variables and %ASK{} interactively. Base64 isn't protection, and the file would still contain the secret."},

{g:4,t:"4.1",p:"After a port change, a script must confirm through the Meraki API that the switch ports are up at the expected speed and without errors. Which call fits?",
o:["GET /devices/{serial}/switch/ports/statuses","GET /devices/{serial}/switch/ports","GET /networks/{networkId}/switch/settings","GET /organizations/{organizationId}/devices/statuses"],
e:"ports/statuses returns live state such as status, speed, duplex, errors and traffic. ports returns configuration only, and device statuses show only whether the switch is online."},

{g:4,t:"4.2",p:"An engineer wants to use a local terminal and scripts against the consoles of CML lab nodes, without adding an external connector. Which CML feature provides this?",
o:["The Breakout Tool, which maps node consoles to local ports","The unmanaged switch node","Link conditioning on each node's links","The node's Day-0 configuration"],
e:"The Breakout Tool runs on the user's machine and forwards each node's console to a local port, so ordinary clients and scripts can use it."},

{g:4,t:"4.2",p:"A test must show that OSPF reconverges when a core link fails. How can this be done in a CML lab?",
o:["Stop the link between the two core nodes through the API, then verify the routing tables","Delete one core node and rebuild the lab after the test","Change the OSPF cost in the production network and watch the lab","Add link conditioning to the core link with very high latency, which makes OSPF treat the link as failed"],
e:"Lab links can be stopped and started programmatically, which simulates a failure cleanly and repeatably. Latency isn't a failure, and deleting nodes loses the lab state."},

{g:4,t:"4.3",p:"Which request lists the images currently tagged golden in Catalyst Center?",
o:["GET /dna/intent/api/v1/image/importation?isTaggedGolden=true","GET /dna/intent/api/v1/image/importation/golden","GET /dna/intent/api/v1/network-device?golden=true","GET /dna/intent/api/v1/image/distribution?status=golden"],
e:"The image list takes filters such as isTaggedGolden, family and version. The golden endpoint is used to tag or untag an image, not to list images."},

{g:4,t:"4.3",p:"Meraki switches across several networks must be upgraded in groups, with a delay between groups. Which API feature fits?",
o:["Staged firmware upgrades, with switch groups and a start time for each stage","A single firmware upgrade per network, scheduled at the same time for every network","Rebooting switches in turn with POST /devices/{serial}/reboot","Copying the image to each switch with the liveTools API"],
e:"Staged upgrades divide MS switches into groups and schedule each stage, which limits the impact if something goes wrong. Meraki firmware isn't copied to devices by the user."},

{g:4,t:"4.4",p:"A request to /dna/intent/api/v1/network-health needs a timestamp. Which format does Catalyst Center expect?",
o:["Epoch time in milliseconds, such as 1761700000000","Epoch time in seconds, such as 1761700000","An ISO 8601 string, such as 2026-10-29T01:00:00Z","A relative time, such as -1h"],
e:"Catalyst Center health APIs use epoch milliseconds. A value in seconds is read as a date in 1970."},

{g:4,t:"4.4",p:"Which Meraki call shows how many wireless clients failed at the association, authentication, DHCP and DNS steps?",
o:["GET /networks/{networkId}/wireless/connectionStats","GET /networks/{networkId}/wireless/clientCountHistory","GET /organizations/{organizationId}/devices/statuses","GET /networks/{networkId}/clients"],
e:"connectionStats breaks connection attempts down by the stage where they fail. clientCountHistory only counts clients, and the clients list has no failure details."},

{g:4,t:"4.5",p:"Which statement about telemetry subscriptions on IOS XE is accurate?",
o:["Dynamic subscriptions are created only with NETCONF establish-subscription; RESTCONF can only configure configured subscriptions","RESTCONF can create dynamic subscriptions, which stream over the HTTPS connection","The CLI can create dynamic subscriptions with telemetry ietf subscription dynamic","Configured subscriptions can only be created from the CLI, because NETCONF and RESTCONF can't change the telemetry configuration on IOS XE"],
e:"A dynamic subscription is tied to the NETCONF session that requested it. RESTCONF, NETCONF and the CLI can all edit the configuration that defines configured subscriptions."},

{g:4,t:"4.5",p:"Telemetry must be encrypted on the way to the collector. Which receiver setting does that?",
c:`telemetry ietf subscription 510
 encoding encode-kvgpb
 filter xpath /process-cpu-ios-xe-oper:cpu-usage/cpu-utilization
 stream yang-push
 update-policy periodic 3000
 ________`,
o:["receiver ip address 10.9.0.50 57500 protocol grpc-tls profile COLLECTOR-TP","receiver ip address 10.9.0.50 57500 protocol grpc-tcp encrypt","receiver ip address 10.9.0.50 443 protocol https","receiver ip address 10.9.0.50 57500 protocol grpc-tcp profile COLLECTOR-TP"],
e:"grpc-tls encrypts the dial-out session and uses a trustpoint (profile) to validate the collector's certificate. grpc-tcp is plain text, and a VRF doesn't encrypt anything."},

{g:4,t:"4.6",p:"Which line completes this Meraki webhook receiver's check?",
c:`@app.post("/meraki")
def meraki_alert():
    # Purpose: accept a Meraki alert only if it carries the shared secret
    body = request.get_json()
    if not ________:
        abort(401)
    queue.put(body)
    return "", 200`,
o:["hmac.compare_digest(body.get(\"sharedSecret\", \"\"), SECRET)","body.get(\"sharedSecret\") is SECRET","hmac.compare_digest(request.headers.get(\"X-Cisco-Meraki-API-Key\", \"\"), API_KEY)","body.get(\"organizationId\") == ORG_ID"],
e:"Meraki puts the configured shared secret in the payload's sharedSecret field. compare_digest compares it in constant time, while is tests object identity, not equality. Org IDs aren't secret, and API keys aren't sent in webhooks."},

{g:4,t:"4.6",p:"How does SD-WAN Manager send alarms to an external HTTPS receiver?",
o:["Through an alarm notification rule with a webhook URL, sent when matching alarms are raised","Through a device template that points each edge at the receiver","Through a Catalyst Center event subscription","Through a NETCONF subscription from the receiver to SD-WAN Manager"],
e:"Alarm notifications match alarm types and severities, and send them by email or webhook. Edges don't post alarms to receivers themselves."},

{g:5,t:"5.1",p:"What does a peer comparison, or comparative insight, in Catalyst Center AI analytics show?",
o:["How a site's or device's KPIs compare with similar sites or devices, so outliers stand out","How the network compares with Cisco's lab benchmarks for each model","A comparison of the running configuration with its golden template","A comparison of two software images before an upgrade"],
e:"Comparing like with like shows where one site or device performs worse than its peers, which a single absolute threshold can miss."},

{g:5,t:"5.1",p:"What's the main value of AI root-cause analysis in a controller during an outage?",
o:["It correlates related events across devices and suggests the likely cause, cutting through alarm noise","It guarantees that the cause it finds is correct, so engineers can act on it without checking the evidence","It replaces the event logs, which aren't kept once AI analysis is on","It fixes the cause automatically on every device"],
e:"One failure often triggers many alarms. Correlation groups them and points to a probable cause, which engineers then confirm."},

{g:5,t:"5.2",p:"An AI assistant keeps producing RESTCONF payloads with wrong node names for a device. Which input most improves its accuracy?",
o:["The pyang tree, or the YANG modules themselves, for the exact revisions on the device","A longer instruction asking it to be careful with node names","The device's hostname and serial number","Example payloads written for a different vendor's YANG models, so it can learn the general JSON structure"],
e:"Giving the model the real schema grounds it in the actual names and structure, instead of whatever its training data suggests."},

{g:5,t:"5.2",p:"An AI assistant wrote a playbook using a module that ansible-doc can't find. What's the best response?",
o:["Check the collection's documentation for the installed version and use the module it lists","Install collections from Ansible Galaxy one at a time until ansible-doc finds a module with that name","Rename an existing module to match the assistant's name","Ask the assistant to confirm that the module exists"],
e:"Assistants sometimes invent modules or use deprecated ones. The installed collection's documentation, along with ansible-doc and ansible-lint, is the authority."},

{g:5,t:"5.3",p:"An AI agent's tools use one service account with full Catalyst Center rights for every user who chats with it. What's the main risk?",
o:["Any user can get the agent to act with rights they don't have themselves","The agent will be slower, because one account handles every call","Catalyst Center will refuse calls from service accounts","Responses will be less accurate for users with fewer rights"],
e:"This is a confused-deputy problem. Each action should be checked against the requesting user's permissions, or run with credentials scoped to that user."},

{g:5,t:"5.3",y:"m",p:"An agent builds shell commands from model output, such as ping targets, and runs them on an automation server. Which two controls reduce the risk? (Choose two.)",
o:["Call programs with argument lists, such as subprocess.run([\"ping\", \"-c\", \"3\", host]), never through a shell","Validate each value, for example checking that host is an IP address, before using it","Add an instruction to the system prompt asking the model never to include shell metacharacters in values","Run the commands as root, so they never fail on permissions","Log nothing, so injected commands can't be traced"],
e:"Without a shell, characters such as ; and | aren't interpreted. Strict validation stops unexpected values. Instructions to the model help but don't enforce anything."},

{g:5,t:"5.4",p:"A FastMCP tool returns a site's entire syslog history, often over 50 MB, and the agent fails or loses context. What's the best fix?",
o:["Add parameters such as a time range, severity and limit, and return a filtered, bounded result","Compress the result with gzip before returning it","Return the log as a resource instead of a tool result, because resources aren't limited by the context window","Split the log over several identical tools"],
e:"Tool results go into the model's context, which is limited. Let the model ask for what it needs, and cap the size."},

{g:5,t:"5.4",y:"m",p:"An agent keeps choosing get_device when it should call get_devices. Which two changes help it pick correctly? (Choose two.)",
o:["Give each tool a distinct name that states its scope, such as get_device_by_serial","Write docstrings that say what each tool returns and when to use it","Shorten both names to single letters","Merge them into one general tool called run, which takes any command and decides for itself what to return","Remove the docstrings so the model isn't distracted"],
e:"Models choose tools from their names, descriptions and schemas. Clear, specific names and descriptions are the main levers."},

{g:5,t:"5.4",p:"What does the Literal type hint do for the AI client?",
c:`from typing import Literal

@mcp.tool()
def set_port_state(switch: str, port: str,
                   state: Literal["enabled", "disabled"]) -> str:
    """Enable or disable one switch port."""
    # Purpose: change the admin state of one port
    return apply_port_state(switch, port, state)`,
o:["It becomes an enum in the input schema, so only enabled or disabled are valid","It's only a hint for code editors and doesn't appear in the schema","It makes state optional, with enabled as the default","It converts any value the model sends into enabled"],
e:"FastMCP turns type hints into JSON Schema, so Literal values become an enum and other values are rejected before the function runs."}
];
