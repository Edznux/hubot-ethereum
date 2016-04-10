# hubot-ethereum

Hubot script for ethereum network.

## dependency

- hubot-redis-brain

## Commands available

- add <address> : Attach address to your user
- rm | delete | remove <address or index> : Detach <address> from the current user. Index is provided by the "list" command.
- list : list addresses from the current user
- check <address> : Get balance from the address provided
- balance : Get the balance of the current user
- nanopool [balance] : Get nanopool balance of the current user (if the miner has mined something
- transaction : List latest transaction of the current user
- price : value of ethereum
- p : alias for price

## Installation

Download the latest version from npm

```
npm install hubot-ethereum
```
Add dependency to your hubot external script:
external-scripts.json
```
[
  //....
  "hubot-redis-brain",
  "hubot-ethereum"
  //....
]

```


## TODO

- [ ] Refactoring
- [ ] Add multiple pool
    + [x] nanopool.org  
    + [ ] ethereumpool   
    + [ ] ethpool   

