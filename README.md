Pokémon Showdown HKX Fork 
========================================================================
### 介绍
Pokémon Showdown HKX Fork版本。可以在命令行和AI进行第九代随机六六单打，默认宝可梦全50级，努力值全85

### 构建指令
```bash
npm install
node build
node pve-battle.js
```

### 中文翻译
使用仓库[Pokemon-Chinese](https://github.com/relat-ivity/Pokemon-Chinese)中的json文件翻译

### 对战AI
- 已接入deepseek作为对手对战，具体在[DEEPSEEK-AI-README.md](./DEEPSEEK-AI-README.md)文档中
- 不使用deep seek时，则是cursor实现的简单的对战ai

### 命令行对战
```bash
$ node pve-battle.js 
=== Pokemon Showdown PVE 对战 ===

输入格式:
   使用招式: move 1
   切换宝可梦: switch 2
   太晶化攻击: move 1 terastallize  (使用第1个招式并太晶化)
   查看队伍: team  (查看所有宝可梦状态)

正在生成随机队伍...

============================================================
Player 的队伍
============================================================

[1] 劈斧螳螂 (F) 属性:Bug/Rock 太晶属性: Bug
    性格: 慢吞吞 (+特攻 -防御)
    特性: 锋锐 描述: This Pokemon's slicing moves have their power multiplied by 1.5.
    携带物品: 厚底靴
    种族值: HP:70 攻击:135 防御:95 特攻:45 特防:70 速度:85
    招式:
       1.剑舞 [Normal] 命中:-- 描述:Raises the user's Attack by 2.
       2.岩斧 [Rock] 威力:65 命中:90% 描述:Sets Stealth Rock on the target's side.
       3.十字剪 [Bug] 威力:80 命中:100% 描述:No additional effect.
       4.近身战 [Fighting] 威力:120 命中:100% 描述:Lowers the user's Defense and Sp. Def by 1.

[2] 由克希 (N) 属性:Psychic 太晶属性: Dark
    性格: 浮躁
    特性: 飘浮 描述: This Pokemon is immune to Ground; Gravity/Ingrain/Smack Down/Iron Ball nullify it.
    携带物品: 吃剩的东西
    种族值: HP:75 攻击:75 防御:130 特攻:75 特防:130 速度:95
    招式:
       1.精神噪音 [Psychic] 威力:75 命中:100% 描述:For 2 turns, the target is prevented from healing.
       2.急速折返 [Bug] 威力:70 命中:100% 描述:User switches out after damaging the target.
       3.再来一次 [Normal] 命中:100% 描述:Target repeats its last move for its next 3 turns.
       4.拍落 [Dark] 威力:65 命中:100% 描述:1.5x damage if foe holds an item. Removes item.

[3] 拳拳蛸 (M) 属性:Rock 太晶属性: Rock
    性格: 淘气 (+防御 -特攻)
    特性: 愤怒甲壳 描述: At 1/2 or less of this Pokemon's max HP: +1 Atk, Sp. Atk, Spe, and -1 Def, Sp. Def.
    携带物品: 焦点镜
    种族值: HP:70 攻击:100 防御:115 特攻:35 特防:55 速度:75
    招式:
       1.蟹钳锤 [Water] 威力:100 命中:90% 描述:High critical hit ratio.
       2.拍落 [Dark] 威力:65 命中:100% 描述:1.5x damage if foe holds an item. Removes item.
       3.剑舞 [Normal] 命中:-- 描述:Raises the user's Attack by 2.
       4.尖石攻击 [Rock] 威力:100 命中:80% 描述:High critical hit ratio.

[4] 圈圈熊 (M) 属性:Normal 太晶属性: Normal
    性格: 天真 (+速度 -特防)
    特性: 飞毛腿 描述: If this Pokemon is statused, its Speed is 1.5x; ignores Speed drop from paralysis.
    携带物品: 剧毒宝珠
    种族值: HP:90 攻击:130 防御:75 特攻:75 特防:75 速度:55
    招式:
       1.深渊突刺 [Dark] 威力:80 命中:100% 描述:For 2 turns, the target cannot use sound moves.
       2.剑舞 [Normal] 命中:-- 描述:Raises the user's Attack by 2.
       3.近身战 [Fighting] 威力:120 命中:100% 描述:Lowers the user's Defense and Sp. Def by 1.
       4.硬撑 [Normal] 威力:70 命中:100% 描述:Power doubles if user is burn/poison/paralyzed.

[5] 大剑鬼 (M) 属性:Water 太晶属性: Dark
    性格: 乐天 (+防御 -特防)
    特性: 激流 描述: At 1/3 or less of its max HP, this Pokemon's offensive stat is 1.5x with Water attacks.
    携带物品: 突击背心
    种族值: HP:95 攻击:100 防御:85 特攻:108 特防:70 速度:70
    招式:
       1.打草结 [Grass] 命中:100% 描述:More power the heavier the target.
       2.水炮 [Water] 威力:110 命中:80% 描述:No additional effect.
       3.冰冻光束 [Ice] 威力:90 命中:100% 描述:10% chance to freeze the target.
       4.拍落 [Dark] 威力:65 命中:100% 描述:1.5x damage if foe holds an item. Removes item.

[6] 泥偶巨人 (N) 属性:Ground/Ghost 太晶属性: Fighting
    性格: 顽皮 (+攻击 -特防)
    特性: 无防守 描述: Every move used by or against this Pokemon will always hit.
    携带物品: 讲究头带
    种族值: HP:89 攻击:124 防御:80 特攻:55 特防:80 速度:55
    招式:
       1.爆裂拳 [Fighting] 威力:100 命中:50% 描述:100% chance to confuse the target.
       2.地震 [Ground] 威力:100 命中:100% 描述:Hits adjacent Pokemon. Double damage on Dig.
       3.尖石攻击 [Rock] 威力:100 命中:80% 描述:High critical hit ratio.
       4.灵骚 [Ghost] 威力:110 命中:90% 描述:Fails if the target has no held item.

============================================================

按回车开始对战...

战斗开始！

与你对战的是：DeepSeek AI

【你】 派出了 劈斧螳螂 (HP: 156/156)

【对手】 派出了 够赞猿 (HP: 100/100)

==================================================
第 1 回合
==================================================
对手出战: 够赞猿 属性:Poison/Psychic HP(%):100/100
当前出战: 劈斧螳螂 属性:Bug/Rock HP:156/156
   携带物品: 厚底靴
   特性: 锋锐 描述：This Pokemon's slicing moves have their power multiplied by 1.5.
   太晶属性: Bug（可以太晶化！）
可用招式:
   1.剑舞 [Normal] 命中：-- (PP: 32/32) 描述：Raises the user's Attack by 2.
   2.岩斧 [Rock] 威力：65 命中：90% (PP: 24/24) 描述：Sets Stealth Rock on the target's side.
   3.十字剪 [Bug] 威力：80 命中：100% (PP: 24/24) 描述：No additional effect.
   4.近身战 [Fighting] 威力：120 命中：100% (PP: 8/8) 描述：Lowers the user's Defense and Sp. Def by 1.
Your choice: move 1

【对手】 够赞猿 使用了 污泥波
  → 效果不理想...
  → 【你】 劈斧螳螂 受到伤害! (HP: 96/156)

【你】 劈斧螳螂 使用了 剑舞
  → 【你】 劈斧螳螂 的攻击上升了 2 级!

[按回车查看下一回合]

==================================================
第 2 回合
==================================================
对手出战: 够赞猿 属性:Poison/Psychic HP(%):100/100
当前出战: 劈斧螳螂 属性:Bug/Rock HP:96/156
   携带物品: 厚底靴
   特性: 锋锐 描述：This Pokemon's slicing moves have their power multiplied by 1.5.
   能力变化: 攻击+2
   太晶属性: Bug（可以太晶化！）
可用招式:
   1.剑舞 [Normal] 命中：-- (PP: 31/32) 描述：Raises the user's Attack by 2.
   2.岩斧 [Rock] 威力：65 命中：90% (PP: 24/24) 描述：Sets Stealth Rock on the target's side.
   3.十字剪 [Bug] 威力：80 命中：100% (PP: 24/24) 描述：No additional effect.
   4.近身战 [Fighting] 威力：120 命中：100% (PP: 8/8) 描述：Lowers the user's Defense and Sp. Def by 1.
Your choice: 
```

Pokémon Showdown
========================================================================

Navigation: [Website][1] | **Server repository** | [Client repository][2] | [Dex repository][3]

  [1]: http://pokemonshowdown.com/
  [2]: https://github.com/smogon/pokemon-showdown-client
  [3]: https://github.com/Zarel/Pokemon-Showdown-Dex

[![Build Status](https://github.com/smogon/pokemon-showdown/workflows/Node.js%20CI/badge.svg)](https://github.com/smogon/pokemon-showdown/actions?query=workflow%3A%22Node.js+CI%22)
[![Dependency Status](https://img.shields.io/librariesio/github/smogon/pokemon-showdown)](https://libraries.io/github/smogon/pokemon-showdown)


Introduction
------------------------------------------------------------------------

Pokémon Showdown is many things:

- A **web site** you can use for Pokémon battling

  - http://pokemonshowdown.com/

- A **JavaScript library** for simulating Pokémon battles and getting Pokédex data

  - [sim/README.md](./sim/README.md)

- Some **command-line tools** for simulating Pokémon battles (which can be used in non-JavaScript programs)

  - [COMMANDLINE.md](./COMMANDLINE.md)

- A **web API** for the web site for Pokémon battling

  - [pokemon-showdown-client: WEB-API.md](https://github.com/smogon/pokemon-showdown-client/blob/master/WEB-API.md)

- A **game server** for hosting your own Pokémon Showdown community and game modes

  - [server/README.md](./server/README.md)

Pokémon Showdown simulates singles, doubles and triples battles in all the games out so far (Generations 1 through 9).


Documentation quick links
------------------------------------------------------------------------

* [PROTOCOL.md][4] - How the client and server communicate with each other.
* [sim/SIM-PROTOCOL.md][5] - The part of the protocol used for battles and battle messages.
* [CONTRIBUTING.md][6] - Useful code standards to understand if you want to send pull requests to PS (not necessary if you're just using the code and not planning to contribute back).
* [ARCHITECTURE.md][7] - A high-level overview of how the code works.
* [Bot FAQ][8] - An FAQ compiled by Kaiepi regarding making Pokemon Showdown bots - mainly chatbots and battle bots.

  [4]: ./PROTOCOL.md
  [5]: ./sim/SIM-PROTOCOL.md
  [6]: ./CONTRIBUTING.md
  [7]: ./ARCHITECTURE.md
  [8]: https://gist.github.com/Kaiepi/becc5d0ecd576f5e7733b57b4e3fa97e


Community
------------------------------------------------------------------------

PS has a built-in chat service. Join our main server to talk to us!

You can also visit the [Pokémon Showdown forums][9] for discussion and help.

  [9]: https://www.smogon.com/forums/forums/pok%C3%A9mon-showdown.209/

If you'd like to contribute to programming and don't know where to start, feel free to check out [Ideas for New Developers][10].

  [10]: https://github.com/smogon/pokemon-showdown/issues/2444


License
------------------------------------------------------------------------

Pokémon Showdown's server is distributed under the terms of the [MIT License][11].

  [11]: ./LICENSE


Credits
------------------------------------------------------------------------

Owner

- Guangcong Luo [Zarel] - Development, Design, Sysadmin

Staff

- Andrew Werner [HoeenHero] - Development
- Annika L. [Annika] - Development
- Chris Monsanto [chaos] - Development, Sysadmin
- Kris Johnson [dhelmise] - Development
- Leonard Craft III [DaWoblefet] - Research (game mechanics)
- Mathieu Dias-Martins [Marty-D] - Research (game mechanics), Development
- Mia A [Mia] - Development

Contributors

- See http://pokemonshowdown.com/credits
