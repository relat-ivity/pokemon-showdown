/**
 * 智能AI - 基于RandomPlayerAI，但会做出更聪明的决策
 * 
 * 使用方式：const { SmartPlayerAI } = require('./smart-ai');
 */

const Sim = require('./dist/sim');
const { RandomPlayerAI } = require('./dist/sim/tools/random-player-ai');

class SmartPlayerAI extends RandomPlayerAI {
	constructor(playerStream, options = {}, debug = false) {
		super(playerStream, { ...options, move: 0.9, mega: 0.7 }, debug);
	}
	
	// 智能选择招式
	chooseMove(active, moves) {
		if (!moves.length) return super.chooseMove(active, moves);
		
		// 获取所有可用招式的详细信息
		const moveScores = moves.map(m => {
			const moveData = Sim.Dex.moves.get(m.move.move);
			let score = 0;
			
			// 基础威力得分
			if (moveData.basePower) {
				score += moveData.basePower;
			}
			
			// 状态招式也有价值
			if (moveData.status || moveData.boosts || moveData.volatileStatus) {
				score += 50;
			}
			
			// 优先度加分
			if (moveData.priority > 0) {
				score += moveData.priority * 20;
			}
			
			// 命中率惩罚
			if (moveData.accuracy && moveData.accuracy < 100) {
				score *= (moveData.accuracy / 100);
			}
			
			// OHKO招式风险较大，降低优先级
			if (moveData.ohko) {
				score = 30;
			}
			
			// 回复类招式在生命值低时优先
			if (moveData.heal || moveData.drain) {
				const hpPercent = this.getHPPercent(active);
				if (hpPercent < 0.5) {
					score += 80;
				} else {
					score += 30;
				}
			}
			
			// Setup招式（强化）在生命值高时优先
			if (moveData.boosts && this.isSetupMove(moveData)) {
				const hpPercent = this.getHPPercent(active);
				if (hpPercent > 0.7) {
					score += 60;
				}
			}
			
			return { move: m, score, data: moveData };
		});
		
		// 按得分排序，选择最高分的招式
		moveScores.sort((a, b) => b.score - a.score);
		
		// 80%概率选择最佳招式，20%概率在前三名中随机选择（增加不可预测性）
		if (this.prng.random() < 0.8) {
			return moveScores[0].move.choice;
		} else {
			const topMoves = moveScores.slice(0, Math.min(3, moveScores.length));
			return this.prng.sample(topMoves).move.choice;
		}
	}
	
	// 智能选择切换的宝可梦
	chooseSwitch(active, switches) {
		if (!switches.length) return super.chooseSwitch(active, switches);
		
		// 如果没有active（强制切换），随机选择
		if (!active) {
			return super.chooseSwitch(active, switches);
		}
		
		// 评估每个可切换的宝可梦
		const switchScores = switches.map(s => {
			let score = 50; // 基础分
			
			// HP百分比
			const hpPercent = this.getHPPercent(s.pokemon);
			score += hpPercent * 30;
			
			// 状态异常惩罚
			if (s.pokemon.status) {
				score -= 20;
			}
			
			return { switch: s, score };
		});
		
		// 选择得分最高的
		switchScores.sort((a, b) => b.score - a.score);
		return switchScores[0].switch.slot;
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
	
	// 判断是否为强化招式
	isSetupMove(moveData) {
		if (!moveData.boosts) return false;
		const boosts = moveData.boosts;
		// 如果提升自己的能力
		if (moveData.target === 'self') {
			return true;
		}
		// 如果提升攻击/特攻/速度
		if (boosts.atk > 0 || boosts.spa > 0 || boosts.spe > 0) {
			return true;
		}
		return false;
	}
}

module.exports = { SmartPlayerAI };

