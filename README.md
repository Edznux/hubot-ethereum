# hubot-ethereum

Hubot script for ethereum network.

## dependency

- hubot-redis-brain

## Commands available

- add <address> : Attach address to your user 
- delete <address> : Delete address from your user 
- remove <address> : Alias for delete
- rm <address> : Alias for delete
- list : list addresses from the current user 
- balance : Get the balance of the current user 
- balance <€ or $> : Get the balance of the current user in the provided currency 
- nanopool [balance] : Get nanopool balance of the current user (if the miner has mined something)
- nanopool <€ or $> : Get nanopool balance of the current user in the provided currency
- transaction : List latest transaction of the current user
- check <address> : Get balance from the address provided 
- price : value of ethereum
- p : alias for price
- version : Print current version of hubot-ethereum
- help : Print this help 
- ? : Alias for help

## Examples

```
> {hubot} ethereum add 0x1ee3797c74b516befbb172eb3e306d70e9446d1a 
> {hubot} ethereum add 0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb
> {hubot} ethereum list
  0x1ee3797c74b516befbb172eb3e306d70e9446d1a
  0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb

> {hubot} ethereum price
  Current value of ether : 11.958€ ($13.420)

> {hubot} ethereum balance
Adress : [`0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb`] balance : [`3.1348954201224757 ETH`] 
Adress : [`0x1ee3797c74b516befbb172eb3e306d70e9446d1a`] balance : [`4.362588966914489 ETH`] 
-------
Total : `7.497` ETH over 2 account(s)

> {hubot} ethereum balance €
Adress : [`0x1ee3797c74b516befbb172eb3e306d70e9446d1a`] balance : [`51.16522990372733`] 
Adress : [`0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb`] balance : [`36.76661865492044`] 
-------
Total : `87.932€` over 2 account(s)

> {hubot} ethereum nanopool
Adress : [`0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb`] balance : [`0.03725937750699482 ETH`] 
Adress : [`0x1ee3797c74b516befbb172eb3e306d70e9446d1a`] balance : [`0.0782871532555 ETH`] 
-------
Total : `0.11554653076249481 ETH` over 2 account(s)

> {hubot} ethereum remove 0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb
> {hubot} ethereum list
0x1ee3797c74b516befbb172eb3e306d70e9446d1a

> {hubot} ethereum check 0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb
Balance : 3.1348954201224757 ETH

> {hubot} ethereum check 0x4e9417353300d7564cb9e9dcf0ed3d3d95fcd6eb € 
Balance : 37.796 €

```

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

- [x] Refactoring
- [ ] Tests
- [ ] Add multiple pool
    + [x] nanopool.org  
    + [ ] ethereumpool   
    + [ ] ethpool