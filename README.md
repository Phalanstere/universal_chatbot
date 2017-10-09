# Universal Chatbot

Taking the principles of aiml - but allowing a dynamic and extendable *.js environment



```
npm install universal_bot
```


To create a new instance of the bot


```
var UniversalBot = require("universal_chatbot);

var bot = new UniversalBot();
```

A typical **aiml.json** file looks like the corresponding **.aiml**  type, with some minor differences.
You have the typical wildcards, like **\*** and **^**, you have the **srai** parameter which redirects the phrase.
You have also the reponse, stored in the **template**. It it is just one string, this will be taken as the desire4d input, it it is an array, it will be understood as a random list.


```
[
    {
        "pattern": "Hello *",
        "srai": null,
        "topic": "greeting",
        "template": [
            "Hi",
            "How is it going"
        ]
    },
    {
        "pattern": "Hi *",
        "srai": null,
        "template": [
            "How is it going, {name}, you old {nickname}?"
        ]
    }
]
```