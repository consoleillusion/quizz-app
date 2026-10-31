// Fill-in-the-gap questions for the SD-WAN set; each replaces the question whose prompt starts with "replaces".
module.exports = [
{replaces:"Which line fills the blank?",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so the session logs in and is ready to send changes to SD-WAN Manager.",
c:`s = requests.Session()
s.verify = "manager-ca.pem"
s.post(f"{base}⟦1⟧",
       data={"j_username": user, "j_password": pw})
s.headers["⟦2⟧"] = s.get(f"{base}⟦3⟧").⟦4⟧`,
bank:["/j_security_check","/dataservice/client/token","/dataservice/auth/token","X-XSRF-TOKEN","X-Auth-Token","text","json()","cookies"],
a:["/j_security_check","X-XSRF-TOKEN","/dataservice/client/token","text"],
e:"Login is a form POST to j_security_check, which sets the session cookie. The XSRF token comes from client/token as plain text and goes in X-XSRF-TOKEN for every change."}},

{replaces:"Which expression lists the WAN edges that are currently reachable?",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so edges lists every WAN edge that SD-WAN Manager can currently reach.",
c:`r = s.get(f"{base}/dataservice/device")
edges = [d for d in r.json()["⟦1⟧"]
         if d["⟦2⟧"] == "⟦3⟧" and d["reachability"] == "⟦4⟧"]`,
bank:["data","response","personality","device-type","vedge","cedge","reachable","up"],
a:["data","personality","vedge","reachable"],
e:"Results are under data. personality is vedge for every WAN edge, including IOS XE platforms, and reachability is reachable or unreachable."}},

{replaces:"Which body asks a statistics endpoint",
q:{g:3,t:"3.2",y:"g",p:"Fill the gaps so the query returns the last hour of app-route statistics.",
c:`POST /dataservice/statistics/approute
{"query": {"condition": "AND",
           "rules": [{"value": [⟦1⟧],
                      "field": "⟦2⟧",
                      "type": "date",
                      "operator": "⟦3⟧"}]}}`,
bank:["\"1\"","1","\"60\"","entry_time","timestamp","last_n_hours","last_hours","between"],
a:["\"1\"","entry_time","last_n_hours"],
e:"Statistics rules use the entry_time field with the last_n_hours operator, and values are always a list of strings."}},

{replaces:"The login task reports success even with a wrong password.",
q:{g:3,t:"3.4",y:"g",p:"The login task reports success even with a wrong password. Fill the gaps so it fails correctly.",
c:`- name: Log in to SD-WAN Manager
  ansible.builtin.uri:
    url: "https://{{ manager }}/j_security_check"
    method: POST
    body_format: form-urlencoded
    body: {j_username: "{{ user }}", j_password: "{{ pw }}"}
    return_content: true
  register: login
  failed_when: login.⟦1⟧ | ⟦2⟧ > 0`,
bank:["content","json","status","length","first","default"],
a:["content","length"],
e:"A failed login returns 200 with the login page in the body, while success returns an empty body, so a non-empty content means failure."}},

{replaces:"Which condition makes this task wait until a template push has finished?",
q:{g:3,t:"3.4",y:"g",p:"Fill the gaps so the task waits until the template push has finished.",
c:`- name: Wait for the push
  ansible.builtin.uri:
    url: "https://{{ manager }}/dataservice/device/action/status/{{ push.json.id }}"
    headers: {Cookie: "{{ login.cookies_string }}"}
  register: st
  until: st.json.⟦1⟧.⟦2⟧ == "⟦3⟧"
  retries: 30
  delay: 10`,
bank:["summary","data","status","state","done","in_progress","success"],
a:["summary","status","done"],
e:"The action's summary status moves from in_progress to done. Check summary.count afterwards for devices that failed."}},

{replaces:"Guest traffic in VPN 20 must leave each branch straight to the internet",
q:{g:3,t:"3.5",y:"g",p:"Fill the gaps in this centralized data policy so guest traffic in VPN 20 leaves each branch directly to the internet.",
c:`policy
 lists
  vpn-list GUEST
   vpn 20
 data-policy _GUEST_DIA
  vpn-list ⟦1⟧
   sequence 10
    match
     source-ip 0.0.0.0/0
    action accept
     ⟦2⟧ use-vpn ⟦3⟧
   default-action accept`,
bank:["GUEST","CORP","20","nat","service","0","512"],
a:["GUEST","nat","0"],
e:"The policy refers to the VPN list by name, not the VPN number. nat use-vpn 0 sends matching traffic out of the transport VPN with NAT."}},

{replaces:"Edge A has an mpls TLOC configured with restrict",
q:{g:3,t:"3.5",y:"g",p:"Fill the gaps so this TLOC uses IPsec and only builds tunnels to other MPLS TLOCs.",
c:`sdwan
 interface GigabitEthernet0/0/1
  tunnel-interface
   encapsulation ⟦1⟧
   color ⟦2⟧ ⟦3⟧`,
bank:["ipsec","gre","mpls","biz-internet","private1","restrict"],
a:["ipsec","mpls","restrict"],
e:"restrict limits a color to tunnels with TLOCs of the same color. Encapsulation can be IPsec or GRE."}}
];
