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

# Passing parameters

Usuallay, you you would pass some parameters, al list of **aiml-type** files, a **strategy** and so forth.

## aiml files

```
var params = {};

params.aiml = [
        "./aiml/conversation_start.json",
    ];


var bot = new UniversalBot( params );
```


## conversation strategy

The bot will follow a conversation strategy which is laid down in a *.json file and may be passed indvidually.


```

[
    {
        "name": "greeting",
        "weight": 0,
        "in": [],
        "out": [
            {
                "name": "identity",
                "weight": 0.33
            },
            {
                "name": "wheather",
                "weight": 0.33
            },
            {
                "name": "compliment",
                "weight": 0.33
            }
        ]
    },
    {
        "name": "identity",
        "weight": 0,
        "in": [
            {
                "name": "greeting",
                "weight": 1
            }
        ],
        "out": [
            {
                "name": "veracity",
                "weight": 0.33
            },
            {
                "name": "compliment",
                "weight": 0.33
            },
            {
                "name": "age",
                "weight": 0.33
            }
        ]
    },
    etc.

```






# AIML 

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


# Conversation Strategies