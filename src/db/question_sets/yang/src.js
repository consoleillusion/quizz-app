// YANG topic set (exam difficulty). Trees and skeletons are real pyang 2.7 output. Correct option(s) first; mk.js shuffles.
const SW = `module: example-sw
  +--rw switch
  |  +--rw hostname      string
  |  +--rw ntp-server*   inet:ip-address
  |  +--rw stp!
  |  |  +--rw priority?   uint16
  |  +--rw port* [name]
  |  |  +--rw name                    string
  |  |  +--rw description?            string
  |  |  +--rw role?                   identityref
  |  |  +--rw vlan?                   uint16
  |  |  +--rw poe-max?                uint8 {poe}?
  |  |  +--rw (speed-mode)?
  |  |  |  +--:(auto)
  |  |  |  |  +--rw auto-negotiate?   empty
  |  |  |  +--:(fixed)
  |  |  |     +--rw speed?            enumeration
  |  |  +--ro in-errors?              uint64
  |  |  +---x clear-counters
  |  |  |  +---w input
  |  |  |     +---w errors-only?   boolean
  |  |  +--rw poe:power
  |  |     +--rw poe:budget?     decimal64
  |  |     +--rw poe:priority?   enumeration
  |  +--rw uplink?       -> ../port/name
  x--ro legacy-stats
     +--ro uptime?   uint32

  rpcs:
    +---x reboot
       +---w input
          +---w delay?   uint16

  notifications:
    +---n port-flap
       +--ro port?   -> /switch/port/name

example-sw namespace: urn:example:sw  (prefix sw)
example-sw-poe namespace: urn:example:sw-poe  (prefix poe, augments port)`;

const IP = `module: ietf-ip

  augment /if:interfaces/if:interface:
    +--rw ipv4!
    |  +--rw enabled?      boolean
    |  +--rw forwarding?   boolean
    |  +--rw mtu?          uint16
    |  +--rw address* [ip]
    |  |  +--rw ip                     inet:ipv4-address-no-zone
    |  |  +--rw (subnet)
    |  |  |  +--:(prefix-length)
    |  |  |  |  +--rw prefix-length?   uint8
    |  |  |  +--:(netmask)
    |  |  |     +--rw netmask?         yang:dotted-quad {ipv4-non-contiguous-netmasks}?
    |  |  +--ro origin?                ip-address-origin`;

module.exports = [
// ---------- 1.1 Model families (9) ----------
{g:1,t:"1.1",y:"m",p:"Which two statements about the Cisco-IOS-XE-native model are true? (Choose two.)",
o:["Its structure follows the IOS XE CLI hierarchy","It covers platform features that the IETF and OpenConfig models don't","It's vendor-neutral, so the same payload works on other vendors' devices","It only holds operational state, so it can't be used to change configuration","It's maintained by the IETF NETMOD working group as a standard"],
e:"Native models mirror the CLI and give the widest coverage of IOS XE features. They're Cisco-specific, and they hold configuration, while state lives mostly in the -oper models."},

{g:1,t:"1.1",p:"A script must read CPU utilization from an IOS XE switch. Which kind of model holds it?",
o:["A Cisco-IOS-XE-*-oper model, such as Cisco-IOS-XE-process-cpu-oper, which holds read-only state","Cisco-IOS-XE-native, under the process configuration","ietf-interfaces, under each interface's statistics","An OpenConfig config container, which reports the applied value of each setting alongside the intended one"],
e:"The -oper models are config false, built for operational data such as CPU, memory and interface counters. Native is for configuration."},

{g:1,t:"1.1",p:"How can a client find out which OpenConfig nodes a particular IOS XE release doesn't implement?",
o:["Read the deviation modules the device advertises, which mark nodes not-supported or changed","Send edit-config requests for every node and record which ones fail","Read the OpenConfig model's description statements, which list the vendors and releases that don't support each node","Compare the OpenConfig model with Cisco-IOS-XE-native line by line"],
e:"Deviations, such as cisco-xe-openconfig-interfaces-deviation, formally describe where an implementation differs from the published model, so clients can adapt without trial and error."},

{g:1,t:"1.1",p:"In openconfig-interfaces, where does a client set an interface's MTU, and where does it read the value actually in effect?",
o:["Set .../interface/config/mtu, and read .../interface/state/mtu","Set .../interface/state/mtu, and read .../interface/config/mtu","Set and read both at .../interface/mtu, because OpenConfig has a single node","Set .../interface/config/mtu, and read it back from the same node"],
e:"OpenConfig separates intended values (config, read-write) from applied and operational values (state, read-only). Comparing them shows whether a change has taken effect."},

{g:1,t:"1.1",p:"Newer revisions of ietf-interfaces mark interfaces-state as deprecated. Where should new code read an interface's oper-status?",
c:`module: ietf-interfaces
  +--rw interfaces
  |  +--rw interface* [name]
  |     +--rw name                        string
  |     +--rw type                        identityref
  |     +--rw enabled?                    boolean
  |     +--ro oper-status                 enumeration
  |     +--ro statistics
  x--ro interfaces-state
     x--ro interface* [name]
        x--ro oper-status                 enumeration`,
o:["Under /interfaces/interface, where ro nodes now sit beside the configuration (NMDA)","Under /interfaces-state/interface, because NMDA keeps state in a separate tree from configuration","Under an -oper model only, because ietf-interfaces holds no state","From the running datastore with get-config, which includes state"],
e:"With NMDA, state lives next to configuration in the same tree, shown as ro nodes. The separate -state tree is kept only for older clients. get-config never returns state."},

{g:1,t:"1.1",p:"A team wants the exact YANG modules, revisions and features that one IOS XE switch implements. What's the most reliable source?",
o:["The device itself, through its YANG library and get-schema","The latest modules in the IETF's GitHub repository","The OpenConfig public repository, which IOS XE tracks automatically","The YANG modules bundled with pyang"],
e:"Each release implements specific revisions, features and deviations. The device's YANG library lists them, and get-schema downloads the exact text. The YangModels/yang repository's vendor/cisco/xe/<release> folders are a good offline copy."},

{g:1,t:"1.1",p:"Hostname EDGE-1 is set through openconfig-system. Later, hostname EDGE-2 is set through Cisco-IOS-XE-native. What does show running-config show?",
o:["hostname EDGE-2, because both models write to the same running configuration","hostname EDGE-1, because OpenConfig takes priority over native","Both, because each model keeps its own separate copy of the configuration on the device","Neither, because mixing models on one device is rejected"],
e:"IOS XE maps every model onto one running configuration, so the last write wins, and either model reads it back."},

{g:1,t:"1.1",p:"Which statement describes IETF YANG models such as ietf-interfaces and ietf-ip?",
o:["They're published in RFCs, are vendor-neutral, and cover features common to most platforms","They're published by Cisco and cover every IOS XE feature","They're written by an operator group, and use config and state containers on every node of the model","They only define notifications, not configuration"],
e:"IETF models, such as ietf-interfaces (RFC 8343) and ietf-ip (RFC 8344), are standards. OpenConfig is the operator-led family with the config/state pattern."},

{g:1,t:"1.1",p:"The tree shows link-up-down-trap-enable? enumeration {if-mib}?. How does a client know whether a given switch supports it?",
o:["Check whether the device lists the if-mib feature for ietf-interfaces in its capabilities or YANG library","Try to set it, because every feature of a module is always supported when the module itself is advertised","Check the leaf's description, which lists supported platforms","It's always supported, because {if-mib}? is only a comment"],
e:"{feature}? marks an if-feature condition. Devices announce the features they implement for each module, and unsupported features' nodes don't exist on that device."},

// ---------- 1.5 Interpreting trees (19) ----------
{g:1,t:"1.5",y:"x",p:"Match each RFC 8340 tree symbol with its meaning.",
s:["? after a node name","* after a node name","! after a node name","-> in the type column"],
r:["A presence container","A leafref, pointing to the path shown","An optional node","A list (with [keys]) or a leaf-list (without)"],
o:["1-c, 2-d, 3-a, 4-b","1-d, 2-c, 3-a, 4-b","1-c, 2-d, 3-b, 4-a","1-a, 2-d, 3-c, 4-b"],
e:"These markers carry most of a tree's meaning: what's required, what repeats, what has meaning by existing, and what refers to other data."},

{g:1,t:"1.5",y:"x",p:"Match each line prefix with what it marks.",
s:["+--ro","+---x","+---n","x--rw"],
r:["A notification","A deprecated, configurable node","Read-only state data","An RPC or action"],
o:["1-c, 2-d, 3-a, 4-b","1-d, 2-c, 3-a, 4-b","1-c, 2-a, 3-d, 4-b","1-c, 2-d, 3-b, 4-a"],
e:"The first character is the status (+ current, x deprecated, o obsolete). Then come the flags: rw config, ro state, -x RPC or action, -n notification, -w input."},

{g:1,t:"1.5",p:"A client creates the switch container. Which leaf must it include?",
c:SW,
o:["hostname, because it has no ? marker and isn't a key","ntp-server, because leaf-lists are always mandatory","uplink, because leafrefs must be set","stp, because presence containers are mandatory"],
e:"A leaf without ? is mandatory (apart from keys, which are always required). Leaf-lists, leafrefs with ? and presence containers are optional."},

{g:1,t:"1.5",p:"What is ntp-server in this tree?",
c:SW,
o:["A leaf-list: a set of IP address values, with no key and no child nodes","A list keyed by IP address, whose entries can hold more leaves such as prefer and key-id","A leaf that holds one IP address","A container that holds the NTP server settings"],
e:"* without [keys] marks a leaf-list, which holds values, unlike a list, which holds keyed entries."},

{g:1,t:"1.5",p:"A client creates stp with no children. What does that mean?",
c:SW,
o:["STP is enabled, and priority takes its default, because stp is a presence container","Nothing, because an empty container is ignored","The request fails, because priority must be given whenever the stp container is created","STP is disabled, because no priority was given"],
e:"! marks a presence container, whose existence carries meaning. Non-presence containers exist only to group their children."},

{g:1,t:"1.5",y:"m",p:"Which two facts can be read from this tree alone? (Choose two.)",
c:SW,
o:["poe-max only exists on devices that support the poe feature","in-errors is state data that can't be configured","vlan must be between 1 and 4094, because the tree shows the uint16 range","vlan is only allowed when role is access","A switch can hold at most 48 ports"],
e:"Trees show features ({poe}?) and config versus state, but not ranges, when or must conditions, unique or max-elements. Those are only in the YANG source."},

{g:1,t:"1.5",p:"A port already has auto-negotiate set. A client then sets speed to 1G on that port. What happens?",
c:SW,
o:["auto-negotiate is removed, because the two leaves are in different cases of one choice","Both leaves are kept, because they're both optional","The request fails until auto-negotiate is deleted first, because a choice can't change case in one edit","speed is ignored, because the auto case was set first"],
e:"Only one case of a choice can exist at a time. Setting a node in another case implicitly deletes the current case's nodes."},

{g:1,t:"1.5",p:"Which RESTCONF request runs clear-counters on port Gi1?",
c:SW,
o:["POST /restconf/data/example-sw:switch/port=Gi1/clear-counters","POST /restconf/operations/example-sw:clear-counters","PUT /restconf/data/example-sw:switch/port=Gi1/clear-counters","POST /restconf/operations/example-sw:switch/port=Gi1/clear-counters"],
e:"clear-counters sits inside a list entry, so it's an action, invoked with POST on the data resource. Only top-level RPCs, such as reboot, live under /restconf/operations."},

{g:1,t:"1.5",p:"Which RESTCONF request runs reboot with a 30-second delay?",
c:SW,
o:["POST /restconf/operations/example-sw:reboot with {\"example-sw:input\": {\"delay\": 30}}","POST /restconf/data/example-sw:reboot with {\"delay\": 30}","POST /restconf/operations/example-sw:reboot with {\"example-sw:reboot\": {\"delay\": 30}}","PUT /restconf/operations/example-sw:reboot with {\"example-sw:input\": {\"delay\": \"30\"}}"],
e:"Top-level RPCs are under /restconf/operations, called with POST, and the parameters are wrapped in module:input. uint16 is a JSON number."},

{g:1,t:"1.5",p:"What does the port-flap entry describe?",
c:SW,
o:["An event the device can send, carrying the name of an existing port","An RPC the client calls to make a port flap","State data counting how often each port has flapped","A configurable list of ports that are allowed to flap"],
e:"-n marks a notification, sent by the device to subscribers. Its port leaf is a leafref, so it names a real port."},

{g:1,t:"1.5",p:"What values can uplink hold?",
c:SW,
o:["Only the name of a port that exists in the port list","Any string, because leafrefs aren't checked","Only port names whose role is trunk","A path expression, such as ../port/name"],
e:"-> marks a leafref. Its value must match an existing instance of the target, so a typo or a deleted port causes an error."},

{g:1,t:"1.5",p:"Which module defines power, and why does the tree show it as poe:power?",
c:SW,
o:["example-sw-poe defines it through an augment, so its nodes carry that module's prefix","example-sw defines it, and poe: marks it as optional","example-sw defines it, and the poe: prefix marks it as existing only when the poe feature is supported","example-sw-poe defines it, and poe: marks the node as deprecated"],
e:"Nodes added by an augment belong to the augmenting module, so the tree prefixes them. In payloads, they need that module's name (JSON) or namespace (XML)."},

{g:1,t:"1.5",p:"What does x--ro legacy-stats tell a developer?",
c:SW,
o:["It's deprecated state data: it still works, but new code shouldn't depend on it","It's an action that returns statistics","It's obsolete, so it has already been removed from every device that implements the module","It's a read-only RPC"],
e:"x is the deprecated status. Deprecated nodes are still implemented but may go away, and o (obsolete) marks nodes that shouldn't be implemented at all."},

{g:1,t:"1.5",y:"g",p:"Fill the gaps so pyang prints only the port subtree, three levels deep, finding imported modules in ./models.",
c:`pyang ⟦1⟧ tree ⟦2⟧ /switch/port ⟦3⟧ 3 ⟦4⟧ ./models example-sw.yang`,
bank:["-f","-o","--tree-path","--jstree-path","--tree-depth","--tree-print-groupings","-p"],
a:["-f","--tree-path","--tree-depth","-p"],
e:"-f picks the output format, --tree-path and --tree-depth trim the tree, and -p adds directories to the search path for imported modules. -o names an output file."},

{g:1,t:"1.5",p:"In ietf-ip, the address list contains (subnet), with no ? marker. What does that mean for each address entry?",
c:IP,
o:["Each entry must include either prefix-length or netmask","Each entry must include both prefix-length and netmask","Neither is required, because both leaves have ?","prefix-length is required, and netmask is optional"],
e:"A choice without ? is mandatory, so one of its cases must be present. Inside the chosen case, the leaves can still be optional."},

{g:1,t:"1.5",p:"Why is ipv4 shown as ipv4! in the ietf-ip tree?",
c:IP,
o:["It's a presence container: creating it turns IPv4 on for the interface, even with no children","It's a mandatory container that every interface must include before any address can be added","It's a list of IPv4 addresses","It's deprecated in favor of a newer IPv4 container"],
e:"Presence containers mean something just by existing. Here, the existence of ipv4 enables IPv4 processing on the interface."},

{g:1,t:"1.5",y:"g",p:"Fill the gaps so the tree matches this YANG source.",
c:`YANG source:
  container ntp {
    leaf enabled { type boolean; }
    container server-cfg { presence "Servers configured"; }
    list server { key "address";
      leaf address { type inet:ip-address; }
      leaf prefer { type boolean; } }
    leaf-list source-vrf { type string; }
    leaf synced { type boolean; config false; }
  }

Tree:
  +--rw ntp
     +--rw enabled⟦1⟧        boolean
     +--rw server-cfg⟦2⟧
     +--rw server⟦3⟧ [address]
     |  +--rw address    inet:ip-address
     |  +--rw prefer?    boolean
     +--rw source-vrf⟦4⟧   string
     +--⟦5⟧ synced?        boolean`,
bank:["?","*","!","ro","rw","-x","->"],
a:["?","!","*","*","ro"],
e:"Optional leaves get ?, presence containers !, and lists and leaf-lists *. config false becomes ro. The same symbol can appear more than once."},

{g:1,t:"1.5",p:"A tree line starts with o--rw. What does that mean?",
o:["The node is obsolete and shouldn't be implemented or used","The node is optional","The node is an output parameter of an RPC","The node is ordered by the user"],
e:"o is the obsolete status, the strongest warning. Optional is shown by ? after the name."},

{g:1,t:"1.5",p:"Part of a tree generated with --tree-depth shows ... under a node. What does it mean?",
c:`  +--rw switch
     +--rw port* [name]
        +--rw (speed-mode)?
        |     ...
        +---x clear-counters
              ...`,
o:["Child nodes exist there but were cut off by the depth limit","The node has no children","The children are hidden because they're deprecated","The node accepts any content"],
e:"--tree-depth and --tree-path shorten output for large models such as Cisco-IOS-XE-native. Increase the depth, or point --tree-path at the subtree, to see more."},

// ---------- 1.3 JSON payloads (11) ----------
{g:1,t:"1.3",y:"g",p:"Fill the gaps so this PATCH to /restconf/data/example-sw:switch creates access port Gi1 in VLAN 10 with high PoE priority.",
c:`{"example-sw:switch": {
   "port": [{
     "name": "Gi1",
     "role": "⟦1⟧",
     "vlan": ⟦2⟧,
     "⟦3⟧": {"priority": "high"}
   }]
}}

${SW}`,
bank:["example-sw:access","sw:access","access","10","\"10\"","example-sw-poe:power","poe:power","power"],
a:["example-sw:access","10","example-sw-poe:power"],
e:"identityref values in JSON take the defining module's name, not its prefix. uint16 is a number, and the augmented container needs its module's name because its namespace differs from its parent's."},

{g:1,t:"1.3",p:"Which JSON sets port Gi1's speed to 1G?",
c:SW,
o:["{\"example-sw:port\": [{\"name\": \"Gi1\", \"speed\": \"1G\"}]}","{\"example-sw:port\": [{\"name\": \"Gi1\", \"speed-mode\": {\"fixed\": {\"speed\": \"1G\"}}}]}","{\"example-sw:port\": [{\"name\": \"Gi1\", \"speed\": 1G}]}","{\"example-sw:port\": [{\"name\": \"Gi1\", \"fixed\": {\"speed\": \"1G\"}}]}"],
e:"Choice and case names never appear in data. Enumerations are JSON strings."},

{g:1,t:"1.3",p:"Which JSON sets two NTP servers?",
c:SW,
o:["{\"example-sw:switch\": {\"hostname\": \"SW1\", \"ntp-server\": [\"10.0.0.1\", \"10.0.0.2\"]}}","{\"example-sw:switch\": {\"hostname\": \"SW1\", \"ntp-server\": [{\"address\": \"10.0.0.1\"}, {\"address\": \"10.0.0.2\"}]}}","{\"example-sw:switch\": {\"hostname\": \"SW1\", \"ntp-server\": \"10.0.0.1 10.0.0.2\"}}","{\"example-sw:switch\": {\"hostname\": \"SW1\", \"ntp-server\": {\"10.0.0.1\": {}, \"10.0.0.2\": {}}}}"],
e:"A leaf-list is a JSON array of values. Lists are arrays of objects, and neither is ever a joined string or a keyed object."},

{g:1,t:"1.3",p:"A RESTCONF GET returns \"in-errors\": \"18446744073709551615\", in quotes. Why?",
c:SW,
o:["RFC 7951 encodes 64-bit integers as JSON strings, so in-errors (uint64) is quoted","The device has a bug and should return a number","State data is always returned as strings","The value overflowed a 32-bit counter, so the device sent it as text instead of a number"],
e:"int64, uint64 and decimal64 are strings in JSON because many JSON parsers lose precision above 2^53. Convert them with int() in Python."},

{g:1,t:"1.3",y:"g",p:"Fill the gaps so this PATCH to /restconf/data/example-sw:switch/port=Gi1 sets a 15.4 W PoE budget with high priority.",
c:`{"example-sw:port": [{
   "name": "Gi1",
   "example-sw-poe:power": {
     "budget": ⟦1⟧,
     "priority": "⟦2⟧"
   }
}]}`,
bank:["\"15.4\"","15.4","high","HIGH","High"],
a:["\"15.4\"","high"],
e:"decimal64 is a JSON string in RFC 7951. Enumerations are case-sensitive strings that must match the model exactly."},

{g:1,t:"1.3",p:"Which body for PATCH /restconf/data/example-sw:switch turns STP on with its default priority?",
c:SW,
o:["{\"example-sw:switch\": {\"stp\": {}}}","{\"example-sw:switch\": {\"stp\": true}}","{\"example-sw:switch\": {\"stp\": [null]}}","{\"example-sw:switch\": {\"stp\": null}}"],
e:"A presence container is an object, so an empty object creates it. [null] is how an empty leaf is encoded, not a container."},

{g:1,t:"1.3",p:"Which body is valid for PUT /restconf/data/example-sw:switch/port=Gi1?",
c:SW,
o:["{\"example-sw:port\": [{\"name\": \"Gi1\", \"description\": \"Uplink\"}]}","{\"example-sw:switch\": {\"port\": [{\"name\": \"Gi1\", \"description\": \"Uplink\"}]}}","{\"port\": [{\"name\": \"Gi1\", \"description\": \"Uplink\"}]}","{\"example-sw:port\": {\"name\": \"Gi1\", \"description\": \"Uplink\"}}"],
e:"The body's top-level member is the target resource, qualified with its module. For a list entry, that's the list name with an array containing the one entry."},

{g:1,t:"1.3",y:"o",p:"Put the YANG Suite steps for building and sending a RESTCONF payload in order.",
s:["Build the RESTCONF request from the selected nodes and values, then run it against the device","Create a YANG module repository, importing modules from the device or from files","Explore the set's modules, select nodes and enter values","Create a YANG set from the repository, including each module's dependencies"],
o:["2, 4, 3, 1","4, 2, 3, 1","2, 3, 4, 1","2, 4, 1, 3"],
e:"Repositories hold modules, YANG sets choose which modules (and dependencies) to work with, and payloads are built from the nodes selected in a set."},

{g:1,t:"1.3",p:"YANG Suite reports that a YANG set is missing dependencies for Cisco-IOS-XE-native. What's the fix?",
o:["Add the modules it imports, such as ietf-inet-types and the Cisco common modules, to the set","Delete the set and use only Cisco-IOS-XE-native","Switch the payload builder from RESTCONF to NETCONF, which doesn't need the dependencies","Lower the module's revision date"],
e:"Modules import types and groupings from others, so a set needs them to resolve the tree. YANG Suite can locate and add missing dependencies from the repository."},

{g:1,t:"1.3",y:"m",p:"Which two are valid RFC 7951 JSON encodings? (Choose two.)",
o:["A uint64 value as a string, such as \"42\"","An empty-type leaf as [null]","A boolean as the string \"true\"","An int8 value as a string, such as \"-5\"","An identityref from another module without its module name"],
e:"Only the 64-bit and decimal types are strings. Booleans are literals, small integers are numbers, and foreign identities need the module name."},

{g:1,t:"1.3",p:"A GET on an interface returns \"ietf-ip:ipv4\": {...} inside the interface object, while name and type have no prefix. Why?",
o:["ipv4 comes from ietf-ip, which augments ietf-interfaces, so it's qualified where the namespace changes","The device prefixes every container in its replies but never any leaves, to keep the JSON compact","ipv4 is deprecated, so it keeps its old prefix","The prefix marks ipv4 as state data"],
e:"Members are qualified only when their module differs from their parent's. Children of ietf-ip:ipv4 are in ietf-ip too, so they aren't prefixed."},

// ---------- 1.4 XML payloads (12) ----------
{g:1,t:"1.4",y:"g",p:"Fill the gaps so this edit-config payload creates access port Gi1 with high PoE priority.",
c:`<switch xmlns="urn:example:sw">
  <port>
    <name>Gi1</name>
    <role xmlns:sw="⟦1⟧">⟦2⟧</role>
    <power xmlns="⟦3⟧">
      <priority>high</priority>
    </power>
  </port>
</switch>`,
bank:["urn:example:sw","urn:example:sw-poe","example-sw","sw:access","access","example-sw:access"],
a:["urn:example:sw","sw:access","urn:example:sw-poe"],
e:"In XML, an identityref is a prefixed name, and the prefix must be bound to the defining module's namespace URI. The augmented container changes the default namespace to the augmenting module's URI."},

{g:1,t:"1.4",p:"Which <port> entry is valid in an edit-config payload?",
c:SW,
o:["<port><name>Gi1</name><description>Uplink</description><vlan>10</vlan></port>","<port><description>Uplink</description><vlan>10</vlan><name>Gi1</name></port>","<port name=\"Gi1\"><description>Uplink</description><vlan>10</vlan></port>","<port><vlan>10</vlan><name>Gi1</name><description>Uplink</description></port>"],
e:"RFC 7950 requires list keys to be encoded first, in the key statement's order, before any other children. Keys are elements, never attributes."},

{g:1,t:"1.4",p:"Which XML sets auto-negotiate on port Gi1?",
c:SW,
o:["<port><name>Gi1</name><auto-negotiate/></port>","<port><name>Gi1</name><auto-negotiate>true</auto-negotiate></port>","<port><name>Gi1</name><speed-mode><auto><auto-negotiate/></auto></speed-mode></port>","<port><name>Gi1</name><auto-negotiate>[null]</auto-negotiate></port>"],
e:"An empty-type leaf is an empty element. Choice and case names never appear, and [null] is the JSON encoding."},

{g:1,t:"1.4",p:"Which XML sets NTP servers 10.0.0.1 and 10.0.0.2?",
c:SW,
o:["<ntp-server>10.0.0.1</ntp-server><ntp-server>10.0.0.2</ntp-server>","<ntp-server>10.0.0.1 10.0.0.2</ntp-server>","<ntp-server><address>10.0.0.1</address><address>10.0.0.2</address></ntp-server>","<ntp-server values=\"10.0.0.1,10.0.0.2\"/>"],
e:"Each leaf-list value is its own element, repeated."},

{g:1,t:"1.4",p:"Which edit-config content turns STP off, without an error if it's already off?",
c:SW,
o:["<switch xmlns=\"urn:example:sw\"><stp xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\" nc:operation=\"remove\"/></switch>","<switch xmlns=\"urn:example:sw\"><stp xmlns:nc=\"urn:ietf:params:xml:ns:netconf:base:1.0\" nc:operation=\"delete\"/></switch>","<switch xmlns=\"urn:example:sw\"><stp>false</stp></switch>","<switch xmlns=\"urn:example:sw\"><stp><priority/></stp></switch>"],
e:"Deleting the presence container turns STP off. remove doesn't fail if it's absent, while delete returns data-missing. A container can't hold a value such as false."},

{g:1,t:"1.4",y:"x",p:"Match each nc:operation value with its behavior.",
s:["create","replace","delete","remove"],
r:["Removes the node, without an error if it doesn't exist","Adds the node, and fails if it already exists","Removes the node, and fails if it doesn't exist","Replaces the node and all its children with the content given"],
o:["1-b, 2-d, 3-c, 4-a","1-d, 2-b, 3-c, 4-a","1-b, 2-d, 3-a, 4-c","1-b, 2-c, 3-d, 4-a"],
e:"merge (the default) creates or updates, create insists on new data, replace overwrites the subtree, and delete and remove differ only in whether a missing node is an error."},

{g:1,t:"1.4",p:"Which pyang command prints a skeleton of the port subtree for an edit-config, leaving out state leaves such as in-errors?",
o:["pyang -f sample-xml-skeleton --sample-xml-skeleton-doctype=config --sample-xml-skeleton-path /switch/port example-sw.yang","pyang -f sample-xml-skeleton --sample-xml-skeleton-defaults --sample-xml-skeleton-annotations --sample-xml-skeleton-path /switch/port example-sw.yang","pyang -f yin --tree-path /switch/port example-sw.yang","pyang -f tree --sample-xml-skeleton-doctype=config example-sw.yang"],
e:"The skeleton's default doctype is data, which includes state. doctype=config gives a <config> root with only configurable nodes. yin is the module itself in XML."},

{g:1,t:"1.4",p:"Which subtree filter returns only the description of port Gi1?",
c:SW,
o:["<switch xmlns=\"urn:example:sw\"><port><name>Gi1</name><description/></port></switch>","<switch xmlns=\"urn:example:sw\"><port><name/><description>Gi1</description></port></switch>","<switch xmlns=\"urn:example:sw\"><port name=\"Gi1\"><description/></port></switch>","<switch xmlns=\"urn:example:sw\"><port><description/></port></switch>"],
e:"In a subtree filter, an element with a value is a content-match node that selects matching entries, and an empty element is a selection node naming what to return."},

{g:1,t:"1.4",y:"g",p:"Fill the gaps so this NETCONF request runs the clear-counters action on port Gi1.",
c:`<rpc message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <⟦1⟧ xmlns="⟦2⟧">
    <switch xmlns="urn:example:sw">
      <port>
        <name>Gi1</name>
        <clear-counters>
          <errors-only>true</errors-only>
        </clear-counters>
      </port>
    </switch>
  </⟦3⟧>
</rpc>`,
bank:["action","operation","edit-config","urn:ietf:params:xml:ns:yang:1","urn:ietf:params:xml:ns:netconf:base:1.0","urn:example:sw"],
a:["action","urn:ietf:params:xml:ns:yang:1","action"],
e:"YANG 1.1 actions are invoked over NETCONF with an <action> element in the urn:ietf:params:xml:ns:yang:1 namespace, which wraps the path to the list entry. The closing tag repeats the same word."},

{g:1,t:"1.4",p:"Which NETCONF request runs the reboot RPC with a 30-second delay?",
c:SW,
o:["<rpc message-id=\"7\" xmlns=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><reboot xmlns=\"urn:example:sw\"><delay>30</delay></reboot></rpc>","<rpc message-id=\"7\" xmlns=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><reboot><delay>30</delay></reboot></rpc>","<rpc message-id=\"7\" xmlns=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><reboot xmlns=\"urn:example:sw\"><input><delay>30</delay></input></reboot></rpc>","<rpc message-id=\"7\" xmlns=\"urn:ietf:params:xml:ns:netconf:base:1.0\"><action xmlns=\"urn:ietf:params:xml:ns:yang:1\"><reboot xmlns=\"urn:example:sw\"><delay>30</delay></reboot></action></rpc>"],
e:"An RPC element goes directly in <rpc>, in its module's namespace, with input parameters as children. There's no <input> wrapper in XML, and <action> is only for actions."},

{g:1,t:"1.4",p:"Port Gi1 has a description, a role and a VLAN. An edit-config sends this. What's left on the port?",
c:`<switch xmlns="urn:example:sw" xmlns:nc="urn:ietf:params:xml:ns:netconf:base:1.0">
  <port nc:operation="replace">
    <name>Gi1</name>
    <description>Printer</description>
  </port>
</switch>`,
o:["Only name and description; role and VLAN are removed","Name, description, role and VLAN, with the new description","Only role and VLAN, because description is replaced","Nothing, because replace deletes the entry first"],
e:"replace makes the entry exactly match the content sent, so leaves that aren't included are deleted. merge would have kept them."},

{g:1,t:"1.4",p:"Which XML puts the poe priority in the right namespace?",
c:SW,
o:["<port><name>Gi1</name><power xmlns=\"urn:example:sw-poe\"><priority>high</priority></power></port>","<port><name>Gi1</name><power><priority>high</priority></power></port>","<port><name>Gi1</name><poe:power><poe:priority>high</poe:priority></poe:power></port>","<port><name>Gi1</name><power xmlns=\"example-sw-poe\"><priority>high</priority></power></port>"],
e:"XML namespaces are URIs. The poe: prefix shown in trees isn't declared in the payload unless you bind it with xmlns:poe, and a module name isn't a namespace."},

// ---------- 2.6 Troubleshooting with YANG (9) ----------
{g:2,t:"2.6",y:"x",p:"Match each error-app-tag defined by RFC 7950 with its cause.",
s:["must-violation","instance-required","missing-choice","data-not-unique"],
r:["A leafref names something that doesn't exist","Two list entries share values that a unique statement forbids","A mandatory choice has none of its cases present","A must expression evaluated to false"],
o:["1-d, 2-a, 3-c, 4-b","1-a, 2-d, 3-c, 4-b","1-d, 2-a, 3-b, 4-c","1-d, 2-c, 3-a, 4-b"],
e:"These app-tags pinpoint which YANG constraint failed, which tells you which statement in the module to read."},

{g:2,t:"2.6",p:"Setting vlan on a trunk port fails, although 10 is within range. The YANG source has vlan { when \"../role = 'sw:access'\"; }. Why?",
c:SW,
o:["The when condition is false for a trunk port, so the vlan node can't exist there","VLAN 10 is reserved for trunks","vlan is state data on trunk ports","role must be deleted before vlan can be set, because the two leaves are in different cases of a choice"],
e:"when makes a node conditional. Trees don't show when, so a failure that the tree can't explain points to the YANG source."},

{g:2,t:"2.6",p:"Setting STP priority to 70000 returns invalid-value. What's wrong?",
c:SW,
o:["The value is outside the range that the model allows for priority","priority is state data","stp must be deleted before priority can change","priority must be sent as a string"],
e:"invalid-value means a value breaks a type restriction such as a range, pattern or enumeration. The YANG source shows uint16 { range \"0..61440\"; }."},

{g:2,t:"2.6",p:"Creating a 49th port fails with error-app-tag too-many-elements. Why?",
o:["The port list has max-elements 48","The port names aren't unique","The switch is missing a mandatory hostname","The 49th port's description is too long"],
e:"max-elements and min-elements limit how many entries a list or leaf-list can hold. Like unique, they don't appear in the tree."},

{g:2,t:"2.6",p:"An edit-config using an openconfig-interfaces leaf returns unknown-element, although the leaf is in the published model. What's the likely cause?",
o:["The device has a deviation marking that leaf not-supported","The leaf must be sent in the native namespace","OpenConfig leaves need a candidate datastore","The payload must use JSON instead of XML"],
e:"A published model describes the whole standard, but each implementation can deviate. Check the device's deviation modules."},

{g:2,t:"2.6",p:"Setting poe-max on one switch model fails with unknown-element, while the same payload works on another. Both run the same release. Why?",
c:SW,
o:["poe-max depends on the poe feature, which the first switch doesn't advertise","poe-max needs a presence container on the first switch, which must be created before the leaf","The first switch needs poe-max as a string","poe-max can only be set with RESTCONF"],
e:"{poe}? means the node exists only where the feature is supported, for example on PoE hardware. Features are listed in each device's YANG library."},

{g:2,t:"2.6",p:"This RESTCONF request returns 400. What's wrong with the body?",
c:`PATCH /restconf/data/example-sw:switch
Content-Type: application/yang-data+json

{"switch": {"hostname": "SW1"}}`,
o:["The top-level member must be module-qualified, as example-sw:switch","hostname must be wrapped in an array, because every RESTCONF leaf value is sent as a list","PATCH can't change hostname","The body must include every port"],
e:"RFC 7951 requires the top-level member to carry its module name. Without it, the server can't place the data in a namespace."},

{g:2,t:"2.6",p:"A payload uses a leaf added in a newer revision of a module, and the device rejects it as unknown. What should be checked?",
o:["Which revision of the module the device implements, in its YANG library","Whether the leaf's description mentions the device model, which limits where it can be used","Whether the payload uses the newest JSON encoding","Whether the device clock matches the revision date"],
e:"Devices implement specific revisions. Code written from a newer model can use nodes that the device's revision doesn't have."},

{g:2,t:"2.6",p:"Setting speed to 1g returns invalid-value, while 1G works. Why?",
c:SW,
o:["Enumeration values are case-sensitive and must match the model exactly","The device only accepts speeds in capital letters, and lowercase values are reserved for other uses","1g is parsed as a number","speed only accepts values from a separate identity"],
e:"Enums are exact strings. The YANG source defines enum 1G, so 1g is a different, unknown value."}
];
