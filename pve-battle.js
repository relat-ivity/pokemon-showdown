/**
 * PVE 对战脚本 - 玩家 vs AI
 * 使用 Pokemon Showdown 模拟器
 * 
 * 运行方式：node pve-battle.js
 */

const Sim = require('./dist/sim');
const { RandomPlayerAI } = require('./dist/sim/tools/random-player-ai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 加载中文翻译文件
let translations = { moves: {}, items: {}, abilities: {}, status: {} };
try {
	const translationPath = path.join(__dirname, 'translations-cn.json');
	if (fs.existsSync(translationPath)) {
		translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
		console.log(`✓ 已加载翻译文件: ${Object.keys(translations.moves).length} 个招式, ${Object.keys(translations.items).length} 个道具, ${Object.keys(translations.abilities).length} 个特性\n`);
	} else {
		console.log('⚠ 未找到 translations-cn.json 文件，将使用英文显示\n');
		// 使用默认的简化翻译表
		translations = {
	// 常用招式翻译
	moves: {
		'Thunderbolt': '十万伏特', 'Thunder': '打雷', 'Thunder Wave': '电磁波',
		'Flamethrower': '喷射火焰', 'Fire Blast': '大字爆炎', 'Flame Charge': '蓄能焰袭',
		'Surf': '冲浪', 'Hydro Pump': '水炮', 'Scald': '热水', 'Water Shuriken': '飞水手里剑',
		'Ice Beam': '冰冻光束', 'Blizzard': '暴风雪',
		'Earthquake': '地震', 'Earth Power': '大地之力',
		'Psychic': '精神强念', 'Psyshock': '精神冲击',
		'Shadow Ball': '暗影球', 'Dark Pulse': '恶之波动',
		'Moonblast': '月亮之力', 'Dazzling Gleam': '魔法闪耀',
		'Dragon Claw': '龙爪', 'Draco Meteor': '流星群',
		'Swords Dance': '剑舞', 'Dragon Dance': '龙之舞', 'Nasty Plot': '诡计',
		'Protect': '守住', 'Substitute': '替身',
		'Stealth Rock': '隐形岩', 'Spikes': '撒菱', 'Toxic Spikes': '毒菱',
		'Toxic': '剧毒', 'Will-O-Wisp': '鬼火',
		'Roost': '羽栖', 'Recover': '自我再生', 'Synthesis': '光合作用',
		'U-turn': '急速折返', 'Volt Switch': '伏特替换',
		'Close Combat': '近身战', 'Drain Punch': '吸取拳', 'Mach Punch': '音速拳',
		'Bullet Punch': '子弹拳', 'Quick Attack': '电光一闪',
		'Stone Edge': '尖石攻击', 'Rock Slide': '岩崩',
		'Gunk Shot': '垃圾射击', 'Sludge Bomb': '污泥炸弹',
		'Energy Ball': '能量球', 'Giga Drain': '终极吸取', 'Solar Beam': '日光束',
		'Iron Head': '铁头', 'Flash Cannon': '加农光炮',
		'Brave Bird': '勇鸟猛攻', 'Hurricane': '暴风',
		'Crunch': '咬碎', 'Knock Off': '拍落',
		'X-Scissor': '十字剪', 'Bug Buzz': '虫鸣',
		'Aqua Tail': '水流尾', 'Waterfall': '攀瀑',
		'Play Rough': '嬉闹', 'Iron Tail': '铁尾',
		'Rapid Spin': '高速旋转', 'Defog': '清除浓雾',
		'Trick Room': '戏法空间', 'Tailwind': '顺风',
		'Light Screen': '光墙', 'Reflect': '反射壁',
		'Wish': '祈愿', 'Baton Pass': '接棒',
		'Encore': '再来一次', 'Taunt': '挑衅',
		'Calm Mind': '冥想', 'Bulk Up': '健美',
		'Agility': '高速移动', 'Rock Polish': '岩石打磨',
	},
	// 常用道具翻译
	items: {
		'Leftovers': '吃剩的东西', 'Life Orb': '生命宝珠',
		'Choice Scarf': '讲究围巾', 'Choice Band': '讲究头带', 'Choice Specs': '讲究眼镜',
		'Focus Sash': '气息腰带', 'Assault Vest': '突击背心',
		'Heavy-Duty Boots': '厚底靴', 'Rocky Helmet': '凹凸头盔',
		'Light Ball': '电气球', 'Eviolite': '进化辉石',
		'Weakness Policy': '弱点保险', 'Air Balloon': '飘浮石',
		'Expert Belt': '达人带', 'Muscle Band': '力量头带',
		'Wise Glasses': '博识眼镜', 'Scope Lens': '焦点镜',
		'Sitrus Berry': '文柚果', 'Lum Berry': '木子果',
		'Mental Herb': '心灵香草', 'White Herb': '白色香草',
		'Damp Rock': '潮湿岩石', 'Heat Rock': '炽热岩石',
		'Smooth Rock': '沙沙岩石', 'Icy Rock': '冰冷岩石',
	},
	// 常用特性翻译
	abilities: {
		'Levitate': '飘浮', 'Pressure': '压迫感', 'Static': '静电',
		'Intimidate': '威吓', 'Adaptability': '适应力', 'Technician': '技术高手',
		'Regenerator': '再生力', 'Magic Bounce': '魔法反射', 'Prankster': '恶作剧之心',
		'Multiscale': '多重鳞片', 'Sturdy': '结实', 'Magic Guard': '魔法防守',
		'Swift Swim': '悠游自如', 'Sand Rush': '拨沙', 'Chlorophyll': '叶绿素',
		'Huge Power': '大力士', 'Pure Power': '瑜伽之力',
		'Sheer Force': '强行', 'Iron Fist': '铁拳',
		'Contrary': '唱反调', 'Unaware': '纯朴',
		'Water Absorb': '储水', 'Volt Absorb': '蓄电', 'Flash Fire': '引火',
		'Thick Fat': '厚脂肪', 'Drought': '日照', 'Drizzle': '降雨',
		'Sand Stream': '扬沙', 'Snow Warning': '降雪',
	},
		// 状态翻译
		status: {
			'slp': '睡眠', 'par': '麻痹', 'frz': '冰冻',
			'brn': '灼伤', 'psn': '中毒', 'tox': '剧毒'
		}
		};
	}
} catch (error) {
	console.log('⚠ 加载翻译文件失败:', error.message);
}

// 简单的机器翻译缓存
const translationCache = new Map();

// 使用百度翻译API的简化版本（不需要密钥）
async function machineTranslate(text) {
	if (!text) return text;
	
	// 检查缓存
	if (translationCache.has(text)) {
		return translationCache.get(text);
	}
	
	try {
		// 这里使用一个简单的翻译规则
		// 如果需要真正的机器翻译，可以替换为调用翻译API
		
		// 暂时返回原文（避免API调用延迟）
		translationCache.set(text, text);
		return text;
	} catch (error) {
		return text;
	}
}

// 翻译函数（同步版本 - 优先使用词典）
function translate(text, category = 'moves') {
	if (!text) return text;
	const map = translations[category];
	return map && map[text] ? map[text] : text;
}

// 智能翻译：词典优先，然后是简单的英文处理
function smartTranslate(text, category = 'moves') {
	if (!text) return text;
	
	// 1. 先查词典
	const map = translations[category];
	if (map && map[text]) {
		return map[text];
	}
	
	// 2. 如果是招式/道具名，尝试智能处理
	// 去掉常见后缀，让英文更清晰
	if (category === 'moves') {
		// 保持英文，但加上常见翻译提示
		return text; // 可以保留英文或添加简单规则
	}
	
	return text;
}

// 创建命令行输入接口
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// 提示输入的辅助函数
function prompt(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

// 主战斗逻辑
async function startPVEBattle() {
	console.log('=== Pokemon Showdown PVE 对战 ===\n');
	
	// 选择世代和格式 - 50级单打对战
	const format = 'gen9battlestadiumsingles';
	const playerName = 'Player';
	
	console.log('\n正在生成随机队伍...\n');
	
	// 创建战斗流
	const streams = Sim.getPlayerStreams(new Sim.BattleStream());
	
	// 设置战斗参数
	const spec = {
		formatid: format,
	};
	
	// 所有可用性格
	const natures = [
		'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
		'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
		'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
		'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
		'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
	];
	
	// 生成随机队伍 - 使用 gen9randombattle 生成，然后设置为50级
	let p1team = Sim.Teams.generate('gen9randombattle');
	// 将所有宝可梦设置为50级，并设置努力值每项为85，添加随机性格
	p1team = p1team.map(pokemon => ({
		...pokemon,
		level: 50,
		nature: pokemon.nature || natures[Math.floor(Math.random() * natures.length)],
		evs: {
			hp: 85,
			atk: 85,
			def: 85,
			spa: 85,
			spd: 85,
			spe: 85
		}
	}));
	
	const p1spec = {
		name: playerName,
		team: Sim.Teams.pack(p1team),
	};
	
	let p2team = Sim.Teams.generate('gen9randombattle');
	// 将所有宝可梦设置为50级，并设置努力值每项为85，添加随机性格
	p2team = p2team.map(pokemon => ({
		...pokemon,
		level: 50,
		nature: pokemon.nature || natures[Math.floor(Math.random() * natures.length)],
		evs: {
			hp: 85,
			atk: 85,
			def: 85,
			spa: 85,
			spd: 85,
			spe: 85
		}
	}));
	
	const p2spec = {
		name: "AI 对手",
		team: Sim.Teams.pack(p2team),
	};
	
	// 显示你的队伍信息
	displayTeamInfo(p1team, playerName);
	
	const continueGame = await prompt('\n按回车开始对战...');
	console.log('\n战斗开始！\n');
	
	// AI 对手
	const ai = new RandomPlayerAI(streams.p2);
	ai.start();
	
	let waitingForChoice = false;
	let currentRequest = null;
	let battleEnded = false;
	let playerTeam = p1team; // 保存队伍信息供查看
	
	// 处理 p1 的消息
	(async () => {
		try {
			for await (const chunk of streams.p1) {
				const lines = chunk.split('\n');
				
				for (const line of lines) {
					// 显示战斗消息（过滤部分冗余信息）
					if (line.startsWith('|')) {
						// 格式化显示重要的战斗信息
						if (line.startsWith('|turn|')) {
							const turn = line.split('|turn|')[1];
							console.log('\n' + '='.repeat(50));
							console.log(`第 ${turn} 回合`);
							console.log('='.repeat(50));
						} else if (line.startsWith('|switch|')) {
							const parts = line.split('|');
							const playerTag = parts[2];
							const pokemon = parts[3];
							const hp = parts[4] || '';
							const isPlayer = playerTag.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const pokemonName = pokemon.split(',')[0];
							const pokemonCN = translate(pokemonName, 'pokemon');
							console.log(`\n${player} 派出了 ${pokemonCN} ${hp ? '(HP: ' + hp + ')' : ''}`);
						} else if (line.startsWith('|move|')) {
							const parts = line.split('|');
							const attacker = parts[2];
							const move = parts[3];
							const target = parts[4];
							const isPlayer = attacker.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const attackerName = attacker.split(': ')[1];
							const attackerCN = translate(attackerName, 'pokemon');
							const moveCN = translate(move, 'moves');
							console.log(`\n${player} ${attackerCN} 使用了 ${moveCN}`);
						} else if (line.startsWith('|-damage|')) {
							const parts = line.split('|');
							const target = parts[2];
							const hp = parts[3];
							const isPlayer = target.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const targetName = target.split(': ')[1];
							const targetCN = translate(targetName, 'pokemon');
							console.log(`  → ${player} ${targetCN} 受到伤害! (HP: ${hp})`);
						} else if (line.startsWith('|-heal|')) {
							const parts = line.split('|');
							const target = parts[2];
							const hp = parts[3];
							const from = parts[4] ? parts[4].replace('[from] item: ', '').replace('[from] ', '') : '';
							const isPlayer = target.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const targetName = target.split(': ')[1];
							const targetCN = translate(targetName, 'pokemon');
							const fromCN = from ? translate(from, 'items') : '';
							const fromText = fromCN ? ` (${fromCN})` : '';
							console.log(`  → ${player} ${targetCN} 恢复了HP!${fromText} (HP: ${hp})`);
						} else if (line.startsWith('|faint|')) {
							const parts = line.split('|');
							const pokemon = parts[2];
							const isPlayer = pokemon.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const pokemonName = pokemon.split(': ')[1];
							const pokemonCN = translate(pokemonName, 'pokemon');
							console.log(`  → ${player} ${pokemonCN} 倒下了!`);
						} else if (line.startsWith('|-supereffective')) {
							console.log('  → 效果拔群!');
						} else if (line.startsWith('|-resisted')) {
							console.log('  → 效果不理想...');
						} else if (line.startsWith('|-crit')) {
							console.log('  → 会心一击!');
						} else if (line.startsWith('|-immune')) {
							console.log('  → 没有效果!');
						} else if (line.startsWith('|-miss')) {
							console.log('  → 攻击没有命中!');
						} else if (line.startsWith('|-terastallize|')) {
							const parts = line.split('|');
							const pokemon = parts[2];
							const teraType = parts[3];
							const isPlayer = pokemon.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const pokemonName = pokemon.split(': ')[1];
							const pokemonCN = translate(pokemonName, 'pokemon');
							console.log(`  → ${player} ${pokemonCN} 太晶化了! 属性变为: ${teraType}`);
						} else if (line.startsWith('|-sidestart|')) {
							const parts = line.split('|');
							const side = parts[2];
							const effect = parts[3].replace('move: ', '');
							const isPlayer = side.startsWith('p1');
							const player = isPlayer ? '【你】' : '【对手】';
							const effectCN = translate(effect, 'moves');
							console.log(`  → ${player} 的场地上散布了 ${effectCN}!`);
						}
					}
					
					// 处理选择请求
					if (line.includes('|request|')) {
						const requestData = line.split('|request|')[1];
						if (requestData) {
							try {
								currentRequest = JSON.parse(requestData);
								if (currentRequest.wait) {
									// 等待对手
									console.log('\n等待对手行动...');
								} else if (currentRequest.forceSwitch) {
									waitingForChoice = true;
									displaySwitchChoices(currentRequest);
								} else if (currentRequest.active) {
									waitingForChoice = true;
									displayChoices(currentRequest);
								}
							} catch (e) {
								console.error('解析请求失败:', e.message);
							}
						}
					}
					
					// 处理错误
					if (line.startsWith('|error|')) {
						const errorMsg = line.replace('|error|', '');
						console.log('\n⚠️ 错误:', errorMsg);
						// 如果有无效选择错误，重新显示选项并等待输入
						if (errorMsg.includes('[Invalid choice]') && currentRequest) {
							waitingForChoice = true;
							if (currentRequest.forceSwitch) {
								displaySwitchChoices(currentRequest);
							} else if (currentRequest.active) {
								displayChoices(currentRequest);
							}
						}
					}
				}
			}
		} catch (err) {
			console.error('玩家流错误:', err);
			battleEnded = true;
		}
	})();
	
	// 监听全知者流（显示完整战斗日志）
	(async () => {
		try {
			for await (const chunk of streams.omniscient) {
				// 只检查实际的战斗结束消息
				// 这些消息会在 "end" 类型的消息块中出现
				if (chunk.startsWith('end\n')) {
					const lines = chunk.split('\n');
					for (const line of lines) {
						if (line.startsWith('|win|')) {
							battleEnded = true;
							const winner = line.split('|win|')[1];
							console.log('\n🏆 战斗结束！');
							console.log(`胜者: ${winner}`);
						} else if (line === '|tie') {
							battleEnded = true;
							console.log('\n⚖️ 战斗结束！平局！');
						}
					}
				}
			}
		} catch (err) {
			console.error('全知者流错误:', err);
			battleEnded = true;
		}
	})();
	
	// 启动战斗
	streams.omniscient.write(`>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1spec)}\n>player p2 ${JSON.stringify(p2spec)}`);
	
	// 等待玩家输入
	while (!battleEnded) {
		await new Promise(resolve => setTimeout(resolve, 100));
		
		if (waitingForChoice) {
			waitingForChoice = false;
			try {
				const choice = await getPlayerChoice();
				if (choice) {
					// 检查是否是特殊命令
					if (choice.toLowerCase() === 'team') {
						// 显示当前队伍状态
						displayBattleTeamStatus(currentRequest);
						waitingForChoice = true; // 重新等待输入
					} else {
						// 直接写入选择，不需要 >p1 前缀
						streams.p1.write(choice);
					}
				}
			} catch (err) {
				console.error('输入错误:', err);
				waitingForChoice = true; // 重新等待输入
			}
		}
	}
	
	console.log('\n感谢游玩！');
	rl.close();
	setTimeout(() => process.exit(0), 500);
}

// 显示可用的选择
function displayChoices(request) {	
	if (request.active && request.active[0]) {
		const active = request.active[0];
		const pokemon = request.side.pokemon;
		
		// 显示当前宝可梦
		const currentPokemon = pokemon[0];
		const speciesName = currentPokemon.ident.split(': ')[1];
		console.log(`\n🎯 当前出战: ${speciesName}`);
		console.log(`   HP: ${currentPokemon.condition}`);
		
		// 显示携带物品（如果已知）
		if (currentPokemon.item) {
			const itemCN = translate(currentPokemon.item, 'items');
			console.log(`   💎 携带物品: ${itemCN}`);
		}
		
		// 显示特性（如果已知）
		if (currentPokemon.ability || currentPokemon.baseAbility) {
			const ability = currentPokemon.ability || currentPokemon.baseAbility;
			const abilityCN = translate(ability, 'abilities');
			console.log(`   ✨ 特性: ${abilityCN}`);
		}
		
		// 显示状态异常
		if (currentPokemon.status) {
			const statusNames = {
				'slp': '💤 睡眠',
				'par': '⚡ 麻痹',
				'frz': '❄️ 冰冻',
				'brn': '🔥 灼伤',
				'psn': '☠️ 中毒',
				'tox': '☠️ 剧毒'
			};
			console.log(`   状态: ${statusNames[currentPokemon.status] || currentPokemon.status}`);
		}
		
		// 显示可用招式
		console.log('\n📋 可用招式:');
		active.moves.forEach((move, index) => {
			const moveCN = translate(move.move, 'moves');
			if (!move.disabled) {
				const ppInfo = move.pp !== undefined ? ` (PP: ${move.pp}/${move.maxpp})` : '';
				console.log(`   ${index + 1}. ${moveCN}${ppInfo}`);
			} else {
				console.log(`   ${index + 1}. ${moveCN} ❌ [已禁用]`);
			}
		});
		
		// 显示太晶化信息
		if (active.canTerastallize) {
			console.log(`\n💠 可以太晶化！太晶属性: ${currentPokemon.teraType || '未知'}`);
		}
		
		console.log('\n💡 输入格式:');
		console.log('   使用招式: move 1');
		console.log('   切换宝可梦: switch 2');
		if (active.canTerastallize) {
			console.log('   太晶化攻击: move 1 terastallize  (使用第1个招式并太晶化)');
		}
		console.log('   查看队伍: team  (查看所有宝可梦状态)');
	}
}

// 显示换人选择
function displaySwitchChoices(request) {
	console.log('\n' + '='.repeat(50));
	console.log('💀 你的宝可梦倒下了！请选择下一个出战的宝可梦：');
	console.log('='.repeat(50));
	
	const pokemon = request.side.pokemon;
	
	console.log('\n🔄 可用的宝可梦:');
	pokemon.forEach((poke, index) => {
		if (!poke.condition.endsWith(' fnt') && !poke.active) {
			const speciesName = poke.ident.split(': ')[1];
			console.log(`   ${index + 1}. ${speciesName} (HP: ${poke.condition})`);
		}
	});
	
	console.log('\n💡 输入格式: switch 2');
}

// 获取玩家选择
async function getPlayerChoice() {
	const choice = await prompt('\n你的选择: ');
	return choice || 'move 1'; // 默认使用第一个招式
}

// 显示队伍信息
function displayTeamInfo(team, trainerName) {
	console.log('='.repeat(60));
	console.log(`🎒 ${trainerName} 的队伍`);
	console.log('='.repeat(60));
	
	team.forEach((pokemon, index) => {
		console.log(`\n【${index + 1}】 ${pokemon.species}${pokemon.name && pokemon.name !== pokemon.species ? ` (${pokemon.name})` : ''}`);
		
		// 等级和性别
		const level = pokemon.level || 100;
		const gender = pokemon.gender ? ` (${pokemon.gender})` : '';
		console.log(`    等级: ${level}${gender}`);
		
		// 性格（优先显示）
		if (pokemon.nature) {
			console.log(`    🎭 性格: ${pokemon.nature}`);
		}
		
		// 特性
		if (pokemon.ability) {
			const abilityCN = translate(pokemon.ability, 'abilities');
			console.log(`    ✨ 特性: ${abilityCN}`);
		}
		
		// 携带物品
		if (pokemon.item) {
			const itemCN = translate(pokemon.item, 'items');
			console.log(`    💎 携带物品: ${itemCN}`);
		}
		
		// 招式
		if (pokemon.moves && pokemon.moves.length > 0) {
			console.log(`    📋 招式:`);
			pokemon.moves.forEach((move, i) => {
				const moveCN = translate(move, 'moves');
				console.log(`       ${i + 1}. ${moveCN}`);
			});
		}
		
		// 个体值（如果不是全31）
		if (pokemon.ivs) {
			const hasNonMaxIV = Object.values(pokemon.ivs).some(iv => iv !== 31);
			if (hasNonMaxIV) {
				const ivStr = `HP:${pokemon.ivs.hp || 31} Atk:${pokemon.ivs.atk || 31} Def:${pokemon.ivs.def || 31} SpA:${pokemon.ivs.spa || 31} SpD:${pokemon.ivs.spd || 31} Spe:${pokemon.ivs.spe || 31}`;
			}
		}
		
		// 努力值（如果有）
		if (pokemon.evs) {
			const hasEVs = Object.values(pokemon.evs).some(ev => ev > 0);
			if (hasEVs) {
				const evs = [];
				if (pokemon.evs.hp) evs.push(`HP:${pokemon.evs.hp}`);
				if (pokemon.evs.atk) evs.push(`Atk:${pokemon.evs.atk}`);
				if (pokemon.evs.def) evs.push(`Def:${pokemon.evs.def}`);
				if (pokemon.evs.spa) evs.push(`SpA:${pokemon.evs.spa}`);
				if (pokemon.evs.spd) evs.push(`SpD:${pokemon.evs.spd}`);
				if (pokemon.evs.spe) evs.push(`Spe:${pokemon.evs.spe}`);
				console.log(`    💪 努力值: ${evs.join(' ')}`);
			}
		}
		
		// 太晶属性（如果是第9代）
		if (pokemon.teraType) {
			console.log(`    💠 太晶属性: ${pokemon.teraType}`);
		}
	});
	
	console.log('\n' + '='.repeat(60));
}

// 显示战斗中的队伍状态
function displayBattleTeamStatus(request) {
	if (!request || !request.side || !request.side.pokemon) {
		console.log('无法获取队伍信息');
		return;
	}
	
	console.log('\n' + '='.repeat(60));
	console.log('📋 你的队伍状态');
	console.log('='.repeat(60));
	
	const pokemon = request.side.pokemon;
	pokemon.forEach((poke, index) => {
		const speciesName = poke.ident.split(': ')[1];
		const isActive = poke.active ? ' ⚔️ [出战中]' : '';
		const isFainted = poke.condition.endsWith(' fnt') ? ' 💀 [已昏厥]' : '';
		
		console.log(`\n【${index + 1}】 ${speciesName}${isActive}${isFainted}`);
		console.log(`    HP: ${poke.condition}`);
		
		// 显示携带物品
		if (poke.item) {
			const itemCN = translate(poke.item, 'items');
			console.log(`    💎 携带物品: ${itemCN}`);
		}
		
		// 显示特性
		if (poke.ability || poke.baseAbility) {
			const ability = poke.ability || poke.baseAbility;
			const abilityCN = translate(ability, 'abilities');
			console.log(`    ✨ 特性: ${abilityCN}`);
		}
		
		// 显示状态异常
		if (poke.status) {
			const statusNames = {
				'slp': '💤 睡眠',
				'par': '⚡ 麻痹',
				'frz': '❄️ 冰冻',
				'brn': '🔥 灼伤',
				'psn': '☠️ 中毒',
				'tox': '☠️ 剧毒'
			};
			console.log(`    状态: ${statusNames[poke.status] || poke.status}`);
		}
		
		// 显示已知的招式
		if (poke.moves && poke.moves.length > 0) {
			const movesCN = poke.moves.map(m => translate(m, 'moves'));
			console.log(`    📋 招式: ${movesCN.join(', ')}`);
		}
	});
	
	console.log('\n' + '='.repeat(60));
}

// 运行 PVE 对战
startPVEBattle().catch(err => {
	console.error('发生错误:', err);
	rl.close();
	process.exit(1);
});

