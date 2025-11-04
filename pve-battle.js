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
let translations = { 
	pokemon: {}, 
	moves: {}, 
	items: {}, 
	abilities: {}, 
	status: {
		'slp': '睡眠', 'par': '麻痹', 'frz': '冰冻',
		'brn': '灼伤', 'psn': '中毒', 'tox': '剧毒'
	}
};

try {
	const translationPath = path.join(__dirname, 'translations-cn.json');
	if (fs.existsSync(translationPath)) {
		const loadedTranslations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
		translations = { ...translations, ...loadedTranslations };
		console.log(`✓ 已加载翻译文件:`);
		console.log(`  - 宝可梦: ${Object.keys(translations.pokemon || {}).length} 个`);
		console.log(`  - 招式: ${Object.keys(translations.moves || {}).length} 个`);
		console.log(`  - 道具: ${Object.keys(translations.items || {}).length} 个`);
		console.log(`  - 特性: ${Object.keys(translations.abilities || {}).length} 个\n`);
	} else {
		console.log('⚠ 未找到 translations-cn.json 文件，将使用英文显示\n');
	}
} catch (error) {
	console.log('⚠ 加载翻译文件失败:', error.message);
	console.log('  将使用英文显示\n');
}

// 翻译函数
function translate(text, category = 'moves') {
	if (!text) return text;
	const map = translations[category];
	return map && map[text] ? map[text] : text;
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

