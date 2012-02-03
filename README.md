# What what what?

This is a demo of [snrub](https://github.com/squaremo/snrub), a
Node.JS module for subscribing to
(PuSH)[http://pubsubhubbub.appspot.com) feeds.

In a nutshell, it's proxying PuSH to the browser using
[SockJS](http://sockjs.org/).

It's designed to run on CloudFoundry. If you deploy it there you'll
need to 1. choose your own secret; 2. change the host string. Both of
these are at the top of `app.js`.

A running version of this demo is at
http://snrub-demo.cloudfoundry.com/.
