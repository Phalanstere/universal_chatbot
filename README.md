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


# Working with intentions

An intention file looks like this:

```
[
    {
        "name": "price",
        "weight": 0,
        "in": [],
        "out": [
            {
                "name": "registration",
                "weight": 0.2
            },
            {
                "name": "payment_mode",
                "weight": 0.2
            },
            {
                "name": "withdrawal",
                "weight": 0.2
            },
            {
                "name": "plausibility",
                "weight": 0.2
            },
            {
                "name": "info_text",
                "weight": 0.2
            }
        ],
        "aiml": "HOW_MUCH",
        "keywords": [
            "price",
            "how much",
            "pay"
        ],
        "excludes": [
            "NEGATION"
        ]
    }
    etc. 
]
```

Each node of this consists of **ins** and **outs**  - that means reference to other nodes. The nodes - taken as a whole - form a Markow chain.

Building such a chain is quite easy, and there some methods in the **bot.intentions.intentions** object.

```
    var obj = bot.intentions.intentions;
```

Here you add some nodes
```
    obj.addNodes(   ['price',
                    'registration', 
                    'payment_mode',
                    'withdrawal'
                    ]);
```

This defines a node in detail
```
    obj.characterize("price", {
        aiml: "HOW_MUCH",
        keywords: ["price", "how much", "pay"],
        excludes: ['NEGATION']
        })
```
With the **aiml** parameter you can set an aiml pointer.
When the user input contains some of the **keywords**, the ususal chain will be overriden and the intention process is privileged.

With this function you create a Markow-relation between different nodes.

```
    self.addRelation("price", ["registration", "payment_mode", "withdrawal"]); 
```


# Bot interaction

bot interaction is quite easy. As a first parameter you pass the input, then the session_id (that will be returned after you have started a conversation, then a callback)


```
bot.input("Who is the leader of the seminaire", null, function( data, error ) {

    if (data) {
        console.log( data );
    }

});

```





# Syntax detection

The bot has an inbuilt **syntax detection** which allows to detect simple sentences (including adverbial phrases and relative sentences)




# Conversation Strategies