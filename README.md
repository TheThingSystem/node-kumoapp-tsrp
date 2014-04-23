node-kumoapp-tsrp
=================
A KumoApp to TSRP gateway.

[Wireless Sensor Tags](http://wirelesstag.net) have an estimated range of over 200m with a battery life of one year.
These communicate to a _Tag Manager_ using a proprietary RF technology.
In turn, the Tag Manager uploads tag readings to a cloud service.

A [KumoApp](http://wirelesstag.net/kumoapp/) is a javascript fragment that is evaluated whenever a reading is updated.
This node package provides a server that listens for reports from a KumoApp and translates them into
[TSRP](http://thethingsystem.com/dev/Thing-Sensor-Reporting-Protocol.html) messages
for use with [The Thing System](http://thethingsystem.com) (or any other TSRP consumer).


Install
-------

    % npm -l install kumoapp-tsrp


Configure
---------
You will need to run the gateway using an "always on" computer on your network.
If you are running the steward, you can use the same machine.
Regardless, you __MUST__ edit _kumoapp-params.js_ to include the IP address and TCP port that the gateway will listen on.


Define
------
Login to the Wireless Sensor Tag [cloud service](https://www.mytaglist.com/eth/).

If you have not already authorized your _Tag Manager_, or associated new wireless sensor tags to your tag manager,
[please do so now](https://www.mytaglist.com/webapp.html).

Now click on [Kumo Apps](https://www.mytaglist.com/eth/app.html),
and then click on [Write Your App](https://www.mytaglist.com/eth/AppCoder.html).
Examine the "Existing Apps" drop-down and see if you have a choice for

    report tag updates to kumoapp-tsrp gateway

If so, select that and create it; otherwise, create a new app with this name that doesn't require any sensor/tag types.
To generate the body of the app, cut-and-paste the output of

    % node kumoapp-define.js

and then create it.


Operate
-------

To try it out:

    % node kumoapp-tsrp.js

or to run it continuously:

    % ./run.sh

You probably want this to run on startup via cron, e.g.,

    @reboot bash -c 'cd .../node-kumoapp-tsrp; (./run.sh &)'

At this point,
whenever the Tag Manager reports a tag update to the Wireless Sensor Tag cloud,
then the cloud service will tell the Tag Manager to make an HTTP call with the status information.
This is translated into a TSRP packet and then multicast across the network.


Finally
-------

Enjoy!
