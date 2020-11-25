# Node RED 

> Node-RED is a tool for wiring together hardware devices, APIs and online services in new and interesting ways.

The initial purpose for this module is to do some alerting with the free/basic version of elasticsearch, because kibana altering, with more options as writing to another index, is only part of the gold and above versions.
I was trying to use the great elastalert also, but for me it was not working as expected.
So I decided to implement this node-red module. I know that there are many others out there, unfortunately also not what I was looking for.
So, here it is: @naimo84/node-red-contrib-elasticsearch

The inital version has only some basic features. For more idea, please open an issue on github. 

## :question: Get Help

 For bug reports and feature requests, open issues. :bug: 

## :sparkling_heart: Support my projects

I open-source almost everything I can, and I try to reply to everyone needing help using these projects. Obviously,
this takes time. You can integrate and use these projects in your applications *for free*! You can even change the source code and redistribute (even resell it).

However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:

 - Starring and sharing the projects you like :rocket:
 - [![PayPal][badge_paypal]][paypal-donations] **PayPal**— You can make one-time donations via PayPal. I'll probably buy a ~~coffee~~ tea. :tea:
 - [![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T6T412CXA) **Ko-fi**— I'll buy a ~~tea~~ coffee. :coffee: :wink:
 - ![](./examples/bitcoin.png) **Bitcoin**—You can send me bitcoins at this address (or scanning the code): `3KDjCmXsGFYawmycXRsVwfFbphog117N8P`
 

Thanks! :heart:

## :cloud: Installation

First of all install [Node-RED](http://nodered.org/docs/getting-started/installation)

```sh
$ sudo npm install -g node-red
# Then open  the user data directory  `~/.node-red`  and install the package
$ cd ~/.node-red
$ npm install node-red-contrib-elasticsearch
```

Or search template in the manage palette menu

Then run

```
node-red
```

## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

```sh
git clone https://github.com/naimo84/node-red-contrib-elasticsearch.git
cd /path/to/node-red-contrib-elasticsearch
npm install
gulp
cd ~/.node-red 
npm install /path/to/node-red-contrib-elasticsearch
```

## :memo: Documentation


### configuration:

- name: node-red displayname for config  
- server: e.g. https://elastic:9200  
- timeout: default 30000ms  

##### if basic authentication is enabled:  

- username: e.g. elastic  
- password : password for user  

### node explanation:

## search

- query
- querytype
- "index": elastic index to query for 
- timerangeFrom
- timerangeTo
- outputalways
- function
- "Check every": how often elasticsearch is checked for new results
## indices

- "index": elastic index to query for 
- "Check every": how often elasticsearch is checked for new results

## ping

- "Check every": how often elasticsearch is checked for new results

A simple true/false check, whether elasticsearch is available or not.

## :scroll: The MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Coded with :heart: in :cloud:


[badge_paypal]: https://img.shields.io/badge/Donate-PayPal-blue.svg

[paypal-donations]: https://paypal.me/NeumannBenjamin
[brave]: https://brave.com/nai412
[contributing]: /CONTRIBUTING.md