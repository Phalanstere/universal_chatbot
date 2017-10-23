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


# File structure and internal logic

**index.js** is where it all begins. Here you define the bot's psychology, set the parameters and so forth.

The bot may follow a strategy.




## aiml files

```
var params = {};

params.aiml = [
        "./aiml/conversation_start.json",
    ];


var bot = new UniversalBot( params );
```

## bot_identity

You can pass a **bot_identity** like this:


```
params.bot_identity = {
    name: "UniversalBot",
    age: 12,   
    hobbys: ["music", "telepathy"]
}
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




</hr>

# The different communication layers

## AIML-Layer 

The most fundamental, in a way *hard-wird* layer is the aiml-level.
Here you just input a phrase - the bozt scans the respectives **aiml-files** and gives an answer

## The paraphrase-Layer

This layer resembles the classical **eliza-bot** logique.
Here the bots gets the input - analyses it grammatically - and gives a return.

The **speechact.js** file refers to the analysis and detection of speechacts. This includes a thougrough syntax analysis.

## AIML combined with intentions


<hr/>

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

The bot also supports **aiml conditions**.  


```
bot.aiml.input ( { pattern: "What's up?", condition:  { mood: "sad" }  }, bot.session, bot.process_aiml);
```

The corresponding json looks like this:

```
    {
        "pattern": "What's up?",
        "condition": true,
        "template": [
            {
            "mood": "sad",
            "template": "I feeld really depressed"    
            },
            {
            "mood": "happy",
            "template": "Life is great"
            }
        ]
    },
```



# Syntax detection

The bot has an inbuilt **syntax detection** which allows to detect simple sentences (including adverbial phrases and relative sentences)




# Conversation Strategies