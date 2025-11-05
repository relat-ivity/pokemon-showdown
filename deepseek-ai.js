/**
 * DeepSeek AI 对战系统
 * 使用 DeepSeek API 进行智能对战决策
 * 
 * 使用前需要：
 * 1. npm install axios
 * 2. 设置环境变量 DEEPSEEK_API_KEY
 */

const Sim = require('./dist/sim');
const { RandomPlayerAI } = require('./dist/sim/tools/random-player-ai');
const axios = require('axios');
const fs = require('fs');

class DeepSeekAI extends RandomPlayerAI {
	constructor(playerStream, options = {}, debug = false, translations = {}) {
		super(playerStream, options, debug);
		this.apiKey = process.env.DEEPSEEK_API_KEY || '';
		this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
		this.translations = translations;
		this.conversationHistory = [];
		this.lastRequest = null;
		this.opponentTeam = {}; // 追踪对手队伍状态
	}
	
	// 接收战斗日志（追踪对手状态）
	receiveLine(line) {
		super.receiveLine(line);
		
		// 解析对手宝可梦出战
		if (line.startsWith('|switch|p1')) {
			const parts = line.split('|');
			if (parts.length >= 4) {
				const ident = parts[2]; // 如 "p1a: Pikachu"
				const details = parts[3]; // 如 "Pikachu, L50, M"
				const condition = parts[4]; // 如 "100/100"
				const speciesName = ident.split(': ')[1];
				
				this.opponentTeam[speciesName] = {
					name: speciesName,
					condition: condition,
					active: true
				};
				
				// 将其他宝可梦设为非出战
				Object.keys(this.opponentTeam).forEach(key => {
					if (key !== speciesName) {
						this.opponentTeam[key].active = false;
					}
				});
			}
		}
		
		// 追踪对手HP变化
		if (line.startsWith('|-damage|p1') || line.startsWith('|-heal|p1')) {
			const parts = line.split('|');
			if (parts.length >= 3) {
				const ident = parts[2];
				const condition = parts[3];
				const speciesName = ident.split(': ')[1];
				
				if (this.opponentTeam[speciesName]) {
					this.opponentTeam[speciesName].condition = condition;
				}
			}
		}
		
		// 追踪对手状态异常
		if (line.startsWith('|-status|p1')) {
			const parts = line.split('|');
			if (parts.length >= 3) {
				const ident = parts[2];
				const status = parts[3];
				const speciesName = ident.split(': ')[1];
				
				if (this.opponentTeam[speciesName]) {
					this.opponentTeam[speciesName].status = status;
				}
			}
		}
		
		// 追踪对手治愈状态
		if (line.startsWith('|-curestatus|p1')) {
			const parts = line.split('|');
			if (parts.length >= 2) {
				const ident = parts[2];
				const speciesName = ident.split(': ')[1];
				
				if (this.opponentTeam[speciesName]) {
					this.opponentTeam[speciesName].status = null;
				}
			}
		}
	}
	
	// 接收请求并保存（重写以支持异步）
	receiveRequest(request) {
		this.lastRequest = request;
		
		// 处理等待状态
		if (request.wait) {
			// 不需要做任何事
		} 
		// 处理强制切换（宝可梦倒下）
		else if (request.forceSwitch) {
			this.handleForceSwitchRequest(request);
		} 
		// 处理队伍预览
		else if (request.teamPreview) {
			super.receiveRequest(request);
		} 
		// 处理选择招式/切换
		else if (request.active) {
			this.handleActiveRequest(request);
		}
	}
	
	// 处理强制切换（异步版本）
	async handleForceSwitchRequest(request) {
		try {
			const pokemon = request.side.pokemon;
			const choices = [];
			
			for (let i = 0; i < request.forceSwitch.length; i++) {
				if (!request.forceSwitch[i]) {
					choices.push('pass');
					continue;
				}
				
				// 获取可切换的宝可梦
				const canSwitch = [];
				for (let j = 0; j < pokemon.length; j++) {
					// 不是当前出战的，且没有倒下
					if (!pokemon[j].active && !pokemon[j].condition.endsWith(' fnt')) {
						canSwitch.push({ slot: j + 1, pokemon: pokemon[j] });
					}
				}
				
				if (canSwitch.length > 0) {
					const target = await this.chooseSwitch(null, canSwitch);
					choices.push(`switch ${target}`);
				} else {
					choices.push('pass');
				}
			}
			
			this.choose(choices.join(', '));
		} catch (error) {
			console.error('handleForceSwitchRequest error:', error);
			this.choose('default');
		}
	}
	
	// 处理主动选择（异步版本）
	async handleActiveRequest(request) {
		try {
			const pokemon = request.side.pokemon;
			const choices = [];
			
			for (let i = 0; i < request.active.length; i++) {
				const active = request.active[i];
				
				// 如果宝可梦已倒下或正在指挥，跳过
				if (pokemon[i].condition.endsWith(` fnt`) || pokemon[i].commanding) {
					choices.push(`pass`);
					continue;
				}
				
				// 获取可用招式
				const moves = [];
				if (active.moves) {
					active.moves.forEach((moveData, j) => {
						if (!moveData.disabled) {
							moves.push({
								choice: `move ${j + 1}`,
								move: moveData
							});
						}
					});
				}
				
				// 获取可切换的宝可梦
				const canSwitch = [];
				for (let j = 0; j < pokemon.length; j++) {
					if (!pokemon[j].active && !pokemon[j].condition.endsWith(` fnt`)) {
						canSwitch.push({ slot: j + 1, pokemon: pokemon[j] });
					}
				}
				
				// 让AI自己决定是使用招式还是切换宝可梦
				if (active.trapped || canSwitch.length === 0) {
					// 如果被困住或没有可切换的宝可梦，只能使用招式
					if (moves.length > 0) {
						const moveChoice = await this.chooseMove(active, moves, canSwitch);
						choices.push(moveChoice);
					} else {
						choices.push(`pass`);
					}
				} else {
					// 让AI自己选择招式或切换（传递切换选项）
					const choice = await this.chooseMoveOrSwitch(active, moves, canSwitch);
					choices.push(choice);
				}
			}
			
			this.choose(choices.join(`, `));
		} catch (error) {
			// 如果出错，使用默认选择
			console.error('handleActiveRequest error:', error);
			this.choose('default');
		}
	}
	
	// 翻译函数
	translate(text, category = 'pokemon') {
		if (!text) return text;
		const textStr = String(text);
		if (this.translations[category] && this.translations[category][textStr]) {
			return this.translations[category][textStr];
		}
		return textStr;
	}
	
	// 构建战场状态描述
	buildBattleState(request) {
		let state = '=== 当前战场状态 ===\n\n';
		
		// 我方完整队伍信息
		if (request.side && request.side.pokemon) {
			state += '【我方队伍】\n';
			request.side.pokemon.forEach((p, i) => {
				const speciesName = p.ident.split(': ')[1];
				const speciesCN = this.translate(speciesName, 'pokemon');
				const speciesData = Sim.Dex.species.get(speciesName);
				
				state += `${i + 1}. ${speciesCN}`;
				if (p.active) state += ' [当前出战]';
				
				// 属性
				if (speciesData.types) {
					state += ` 属性:${speciesData.types.join('/')}`;
				}
				
				// HP和状态
				if (p.condition) {
					const condition = p.condition.toString();
					if (condition.includes('fnt')) {
						state += ' [已倒下]';
					} else {
						const hpMatch = condition.match(/(\d+)\/(\d+)/);
						if (hpMatch) {
							const current = parseInt(hpMatch[1]);
							const max = parseInt(hpMatch[2]);
							const percent = Math.round((current / max) * 100);
							state += ` HP:${percent}%`;
							
							// 状态异常
							const statusMatch = condition.match(/\s+(\w+)$/);
							if (statusMatch) {
								const status = statusMatch[1];
								const statusMap = {
									'psn': '中毒', 'tox': '剧毒', 'brn': '灼伤',
									'par': '麻痹', 'slp': '睡眠', 'frz': '冰冻'
								};
								state += ` [${statusMap[status] || status}]`;
							}
						}
					}
				}
				
				// 特性
				if (p.baseAbility) {
					const abilityData = Sim.Dex.abilities.get(p.baseAbility);
					const abilityCN = this.translate(abilityData.name, 'abilities');
					state += ` 特性:${abilityCN}`;
				}
				
				// 携带物品
				if (p.item) {
					const itemData = Sim.Dex.items.get(p.item);
					const itemCN = this.translate(itemData.name, 'items');
					state += ` 道具:${itemCN}`;
				}
				
				// 太晶属性
				if (p.teraType) {
					state += ` 太晶:${p.teraType}`;
				}
				
				state += '\n';
				
				// 招式列表（只对我方显示）
				if (p.moves && p.moves.length > 0) {
					state += `   招式: `;
					const moveNames = p.moves.map(moveName => {
						const moveData = Sim.Dex.moves.get(moveName);
						const moveCN = this.translate(moveData.name, 'moves');
						let moveStr = `${moveCN}[${moveData.type}]`;
						if (moveData.basePower) moveStr += `威力${moveData.basePower}`;
						return moveStr;
					});
					state += moveNames.join(', ') + '\n';
				}
			});
		}
		
		// 当前出战宝可梦的详细信息
		if (request.active && request.active[0]) {
			const active = request.active[0];
			const currentPokemon = request.side.pokemon.find(p => p.active);
			
			if (currentPokemon) {
				const speciesName = currentPokemon.ident.split(': ')[1];
				const speciesCN = this.translate(speciesName, 'pokemon');
				
				state += `\n【当前出战详情】${speciesCN}\n`;
				
				// 能力等级变化
				if (active.stats) {
					const boosts = [];
					if (active.stats.atk && active.stats.atk !== 0) boosts.push(`攻击${active.stats.atk > 0 ? '+' : ''}${active.stats.atk}`);
					if (active.stats.def && active.stats.def !== 0) boosts.push(`防御${active.stats.def > 0 ? '+' : ''}${active.stats.def}`);
					if (active.stats.spa && active.stats.spa !== 0) boosts.push(`特攻${active.stats.spa > 0 ? '+' : ''}${active.stats.spa}`);
					if (active.stats.spd && active.stats.spd !== 0) boosts.push(`特防${active.stats.spd > 0 ? '+' : ''}${active.stats.spd}`);
					if (active.stats.spe && active.stats.spe !== 0) boosts.push(`速度${active.stats.spe > 0 ? '+' : ''}${active.stats.spe}`);
					if (boosts.length > 0) {
						state += `能力变化: ${boosts.join(', ')}\n`;
					}
				}
				
				// 可用招式（带PP）
				state += '可用招式:\n';
				active.moves.forEach((move, index) => {
					if (!move.disabled) {
						const moveData = Sim.Dex.moves.get(move.move);
						const moveCN = this.translate(moveData.name, 'moves');
						state += `  ${index + 1}. ${moveCN} [${moveData.type}]`;
						if (moveData.basePower) state += ` 威力:${moveData.basePower}`;
						if (moveData.accuracy === true) {
							state += ` 命中:必中`;
						} else if (moveData.accuracy) {
							state += ` 命中:${moveData.accuracy}%`;
						}
						if (move.pp !== undefined) state += ` PP:${move.pp}/${move.maxpp}`;
						if (moveData.shortDesc) state += ` (${moveData.shortDesc})`;
						state += '\n';
					}
				});
				
				// 太晶化
				if (active.canTerastallize) {
					state += `\n可太晶化！太晶属性: ${currentPokemon.teraType || '未知'}\n`;
				}
			}
		}
		
		// 对手队伍信息（不显示招式和特性）
		state += '\n【对手队伍】\n';
		const opponentPokemon = Object.values(this.opponentTeam);
		if (opponentPokemon.length > 0) {
			opponentPokemon.forEach((p, i) => {
				const speciesCN = this.translate(p.name, 'pokemon');
				const speciesData = Sim.Dex.species.get(p.name);
				
				state += `${i + 1}. ${speciesCN}`;
				if (p.active) state += ' [当前出战]';
				
				// 属性
				if (speciesData.types) {
					state += ` 属性:${speciesData.types.join('/')}`;
				}
				
				// HP和状态
				if (p.condition) {
					if (p.condition.includes('fnt')) {
						state += ' [已倒下]';
					} else {
						const hpMatch = p.condition.match(/(\d+)\/(\d+)/);
						if (hpMatch) {
							const current = parseInt(hpMatch[1]);
							const max = parseInt(hpMatch[2]);
							const percent = Math.round((current / max) * 100);
							state += ` HP:${percent}%`;
						}
					}
				}
				
				// 状态异常
				if (p.status) {
					const statusMap = {
						'psn': '中毒', 'tox': '剧毒', 'brn': '灼伤',
						'par': '麻痹', 'slp': '睡眠', 'frz': '冰冻'
					};
					state += ` [${statusMap[p.status] || p.status}]`;
				}
				
				state += '\n';
			});
		} else {
			state += '（暂无对手信息）\n';
		}
		
		return state;
	}
	
	// 调用 DeepSeek API
	async callDeepSeek(prompt, systemPrompt) {
		if (!this.apiKey) {
			return null;
		}
		
		try {
			const messages = [
				{ role: 'system', content: systemPrompt },
				...this.conversationHistory.slice(-6), // 保留最近3轮对话
				{ role: 'user', content: prompt }
			];
			
			const response = await axios.post(
				this.apiUrl,
				{
					model: 'deepseek-chat',
					messages: messages,
					temperature: 0.7,
					max_tokens: 500
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${this.apiKey}`
					},
					timeout: 10000 // 10秒超时
				}
			);
			
			const aiResponse = response.data.choices[0].message.content;
			
			// 保存对话历史
			this.conversationHistory.push(
				{ role: 'user', content: prompt },
				{ role: 'assistant', content: aiResponse }
			);
			
			return aiResponse;
		} catch (error) {
			// 静默处理错误，使用备用AI
			return null;
		}
	}
	
	// 解析 AI 响应
	parseAIResponse(response) {
		if (!response) return null;
		
		// 尝试提取选择指令
		// 匹配 "move 1" 或 "switch 2" 等格式
		const moveMatch = response.match(/move\s+(\d+)(\s+terastallize)?/i);
		if (moveMatch) {
			return {
				type: 'move',
				index: parseInt(moveMatch[1]) - 1,
				terastallize: !!moveMatch[2]
			};
		}
		
		const switchMatch = response.match(/switch\s+(\d+)/i);
		if (switchMatch) {
			return {
				type: 'switch',
				index: parseInt(switchMatch[1]) - 1
			};
		}
		
		return null;
	}
	
	// 智能选择招式或切换（新方法）
	async chooseMoveOrSwitch(active, moves, switches) {
		if (!this.apiKey) {
			// 没有API时使用简单逻辑：优先使用招式
			return this.chooseMoveSmart(active, moves);
		}
		
		// 构建战场状态
		const battleState = this.buildBattleState(this.lastRequest);
		
		// 构建可选动作（招式+切换）
		let actions = '【可选动作】\n\n';
		
		// 招式选项
		if (moves && moves.length > 0) {
			actions += '使用招式:\n';
			moves.forEach((m, i) => {
				const moveData = Sim.Dex.moves.get(m.move.move);
				const moveCN = this.translate(moveData.name, 'moves');
				actions += `  move ${i + 1}: ${moveCN} [${moveData.type}]`;
				if (moveData.basePower) actions += ` 威力:${moveData.basePower}`;
				if (moveData.accuracy === true) {
					actions += ` 命中:必中`;
				} else if (moveData.accuracy) {
					actions += ` 命中:${moveData.accuracy}%`;
				}
				actions += '\n';
			});
		}
		
		// 切换选项
		if (switches && switches.length > 0) {
			actions += '\n切换宝可梦:\n';
			switches.forEach((s) => {
				const speciesName = s.pokemon.ident.split(': ')[1];
				const speciesCN = this.translate(speciesName, 'pokemon');
				const speciesData = Sim.Dex.species.get(speciesName);
				const condition = s.pokemon.condition || '未知';
				
				actions += `  switch ${s.slot}: ${speciesCN}`;
				if (speciesData.types) actions += ` [${speciesData.types.join('/')}]`;
				actions += ` HP:${condition}`;
				if (s.pokemon.status) actions += ` [${s.pokemon.status}]`;
				actions += '\n';
			});
		}
		
		let extraInfo = '';
		if (active.canTerastallize) {
			extraInfo += '\n提示: 可以在使用招式时同时太晶化（例如：move 1 terastallize）\n';
		}
		
		const prompt = `${battleState}${extraInfo}\n\n${actions}\n\n请分析当前战况，选择最佳行动。只输出指令，不要解释。指令格式：move X（使用第X个招式）、move X terastallize（使用第X个招式并太晶化）、switch X（切换到第X个宝可梦）`;
		
		const systemPrompt = `你是一个宝可梦对战专家。现在你要进行六六单打，你需要根据当前战场状态，分析双方的优势劣势，选择最优的战术。
				考虑因素包括：
				1. 如何和队友进行交换配合，配合进攻，以及配合防守，谁辅助谁输出
				2. 招式威力、属性克制、命中率
				3. 当前HP状况和能力变化
				4. 场地效果和天气影响
				5. 是否需要太晶化
				6. PP剩余量
				7. 是否需要交换宝可梦（考虑换人时机）
				请务必只回答指令格式（X是数字）：招式指令为move X 或 move X terastallize，交换宝可梦指令为switch X`;
		
		// console.log("prompt：" + prompt);
		// console.log("systemPrompt：" + systemPrompt);
		const aiResponse = await this.callDeepSeek(prompt, systemPrompt);
		// console.log("AI选择：" + aiResponse);
		
		if (aiResponse) {
			const parsed = this.parseAIResponse(aiResponse);
			
			// 如果AI选择使用招式
			if (parsed && parsed.type === 'move' && moves[parsed.index]) {
				let choice = moves[parsed.index].choice;
				if (parsed.terastallize && active.canTerastallize) {
					choice += ' terastallize';
				}
				return choice;
			}
			
			// 如果AI选择切换宝可梦
			if (parsed && parsed.type === 'switch') {
				const targetSwitch = switches.find(s => s.slot === parsed.index + 1);
				if (targetSwitch) {
					return `switch ${targetSwitch.slot}`;
				}
			}
		}
		
		// 如果AI调用失败或解析失败，使用备用智能逻辑
		return this.chooseMoveSmart(active, moves);
	}
	
	// 智能选择招式（原有方法，仅用于被困住时）
	async chooseMove(active, moves) {
		if (!moves.length) {
			return 'move 1';
		}
		
		// 使用备用智能逻辑
		return this.chooseMoveSmart(active, moves);
	}
	
	// 备用智能选择逻辑
	chooseMoveSmart(active, moves) {
		const moveScores = moves.map(m => {
			const moveData = Sim.Dex.moves.get(m.move.move);
			let score = 0;
			
			if (moveData.basePower) score += moveData.basePower;
			if (moveData.status || moveData.boosts) score += 50;
			if (moveData.priority > 0) score += moveData.priority * 20;
			if (moveData.accuracy && moveData.accuracy < 100) {
				score *= (moveData.accuracy / 100);
			}
			
			return { move: m, score };
		});
		
		moveScores.sort((a, b) => b.score - a.score);
		return moveScores[0].move.choice;
	}
	
	// 智能选择切换
	async chooseSwitch(active, switches) {
		try {
			if (!switches || !switches.length) {
				return 1;
			}
			
			if (!this.apiKey) {
				// 使用简单的选择逻辑：选择HP最高的
				let best = switches[0];
				for (const s of switches) {
					const hp = this.getHPPercent(s.pokemon);
					const bestHp = this.getHPPercent(best.pokemon);
					if (hp > bestHp && !s.pokemon.status) {
						best = s;
					}
				}
				return best.slot;
			}
			
			const battleState = this.buildBattleState(this.lastRequest);
			
			let actions = '可切换的宝可梦:\n';
			switches.forEach((s, i) => {
				const speciesName = s.pokemon.ident.split(': ')[1];
				const speciesCN = this.translate(speciesName, 'pokemon');
				const condition = s.pokemon.condition || '未知';
				actions += `${s.slot}. ${speciesCN} (${condition})\n`;
			});
			
			const prompt = `${battleState}\n\n${actions}\n\n${active ? '请选择切换的宝可梦' : '你的宝可梦倒下了，请选择下一个出战的宝可梦'}。请直接回答 "switch X"（X为宝可梦编号）。并简要说明理由。`;
			
			const systemPrompt = `你是一个宝可梦对战专家。根据当前战况，选择最合适的宝可梦出战。考虑HP状况、属性克制、特性和招式配合。`;
			
			const aiResponse = await this.callDeepSeek(prompt, systemPrompt);
			
			if (aiResponse) {
				const parsed = this.parseAIResponse(aiResponse);
				if (parsed && parsed.type === 'switch') {
					// 找到对应slot的宝可梦
					const targetSwitch = switches.find(s => s.slot === parsed.index + 1);
					if (targetSwitch) {
						return targetSwitch.slot;
					}
				}
			}
			
			// 备用逻辑：选择HP最高的
			let best = switches[0];
			for (const s of switches) {
				const hp = this.getHPPercent(s.pokemon);
				const bestHp = this.getHPPercent(best.pokemon);
				if (hp > bestHp && !s.pokemon.status) {
					best = s;
				}
			}
			return best.slot;
		} catch (error) {
			console.error('chooseSwitch error:', error);
			return switches && switches.length > 0 ? switches[0].slot : 1;
		}
	}
	
	// 获取HP百分比
	getHPPercent(pokemon) {
		if (!pokemon.condition) return 1;
		const condition = pokemon.condition.toString();
		const parts = condition.split('/');
		if (parts.length < 2) return 1;
		const current = parseInt(parts[0]);
		const max = parseInt(parts[1].split(' ')[0]);
		return max > 0 ? current / max : 1;
	}
}

module.exports = { DeepSeekAI };

module.exports = { DeepSeekAI };
