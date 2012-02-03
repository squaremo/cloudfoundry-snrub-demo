# What what what?

This is a demo of [snrub](https://github.com/squaremo/snrub), a
Node.JS module for subscribing to
(PuSH)[http://pubsubhubbub.appspot.com) feeds.

In a nutshell, it's proxying PuSH to the browser using
[SockJS](http://sockjs.org/).

It's designed to run on CloudFoundry but can in principle run
anywhere. To run in a publicly-accessible place you'll want to set two
environment entries. For CloudFoundry:

    $ vmc env-add my-snrub-demo SECRET="totally random string"
    $ vmc env-add my-snrub-demo HOST="http://my-snrub-demo.cloudfoundry.com"

Note that the host must start with the protocol, i.e., `"http://"`.

A running version of this demo is at
http://snrub-demo.cloudfoundry.com/.
