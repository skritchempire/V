import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Droplet, Wind, Activity, Wrench, ArrowUpCircle, AlertTriangle, Users, PlusCircle, Heart, Train, Skull, ShieldAlert, DoorClosed, Map, Footprints, Radio, Sparkles, X, Swords, Martini, Sprout, ShoppingCart, Crosshair, Star, HelpCircle, Database, FlaskConical, Lock, Shield, Cpu, ShieldHalf, Syringe, Bomb, CarFront, CheckSquare, Rocket, ZapOff, Flame, Bug, Scale, Briefcase, Target, Hand, Settings, Save, RotateCcw, Download } from 'lucide-react';


        // --- НАСТРОЙКИ ---
        const apiKey = ""; 
        const DEFAULT_TICK_RATE = 2000;
        const UPGRADE_COST_BASE = 50; 
        const EVENT_CHANCE = 0.12; 
        const QUEUE_CHANCE = 0.08; 
        const MAX_ROOMS = 16; 

        // --- OFFLINE БАЗА ДАННЫХ ---
        const OFFLINE_RADIO = ["Внимание, патруль над квадратом С-4.", "Глушилки активны, перехожу на резервную частоту.", "Слышим гул под землей. Они копают.", "Караван Спарты разбит у станции Площадь Ильича.", "Купол пульсирует. Ждите бурю.", "Кто-нибудь слышит? У нас прорыв!"];
        const OFFLINE_QUESTS = ["Мы нашли старый бункер, двери заклинило.", "В тоннеле следы крови и брошенный рюкзак.", "Дроны сканируют обвал впереди, там что-то ценное.", "Впереди застрявшая вагонетка с символикой Ганзы."];
        const OFFLINE_REPORTS = ["Едва ушли от патруля.", "Тихая ходка, почти никого не встретили.", "Напоролись на засаду, но отбились.", "Пустоши сегодня злые, еле дотащили лут."];

        const callGemini = async (prompt, type = 'radio') => {
          if (!apiKey) {
             if (type === 'radio') return OFFLINE_RADIO[Math.floor(Math.random() * OFFLINE_RADIO.length)];
             if (type === 'quest') return OFFLINE_QUESTS[Math.floor(Math.random() * OFFLINE_QUESTS.length)];
             if (type === 'report') return OFFLINE_REPORTS[Math.floor(Math.random() * OFFLINE_REPORTS.length)];
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
          const payload = { contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "Ты ИИ выживших в метро. Отвечай коротко, мрачно и атмосферно (1-2 предложения)." }] } };
          try {
             const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
             if (!response.ok) throw new Error();
             const data = await response.json();
             return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || OFFLINE_RADIO[0];
          } catch (error) {
             if (type === 'radio') return OFFLINE_RADIO[Math.floor(Math.random() * OFFLINE_RADIO.length)];
             if (type === 'quest') return OFFLINE_QUESTS[Math.floor(Math.random() * OFFLINE_QUESTS.length)];
             if (type === 'report') return OFFLINE_REPORTS[Math.floor(Math.random() * OFFLINE_REPORTS.length)];
          }
        };

        const getBuildCost = (roomsCount) => {
          const multiplier = Math.pow(1.5, Math.max(0, roomsCount - 5)); 
          return { energy: Math.floor(40 * multiplier), mushrooms: Math.floor(40 * multiplier) };
        };

        const LOCATIONS = {
          ruins: { name: "Руины", risk: 1, lootMult: 1, types: ['water', 'energy', 'air'] },
          factory: { name: "Завод", risk: 1.5, lootMult: 1.5, types: ['energy', 'air'] },
          hospital: { name: "Госпиталь", risk: 1.5, lootMult: 1.5, types: ['mushrooms', 'vodka', 'stimpaks'] },
          military: { name: "Военная База", risk: 2.5, lootMult: 2, types: ['weapons', 'armor', 'science', 'droneParts'] }
        };

        const TRAITS = [
          { id: 'normis', icon: '😐', name: 'Нормис', desc: 'Обычный выживший' },
          { id: 'soy', icon: '🌱', name: 'Соевый', desc: 'Мораль падает быстрее, легко бунтует' },
          { id: 'skuf', icon: '🍺', name: 'Скуф', desc: 'Эффективен с дизелем, пьет за двоих.' },
          { id: 'gigachad', icon: '🗿', name: 'Гигачад', desc: 'Колоссальный шанс выжить на поверхности' },
          { id: 'leader', icon: '👑', name: 'Командир', desc: 'Скидка на постройки 10%. Смерть = Конец Игры.' },
          { id: 'mutant_worker', icon: '🧟', name: 'Ударник', desc: 'Мутант: Ферма и Очистная x3' },
          { id: 'mutant_combat', icon: '🧌', name: 'Громила', desc: 'Мутант: Защита базы +3' },
          { id: 'mutant_psi', icon: '🧠', name: 'Псионик', desc: 'Мутант: Наука в Лаборатории x3' }
        ];

        const CRINGE_NAMES = ['Скуф', 'Альтушка', 'Биба', 'Боба', 'Гигачад', 'Сигма', 'Анк', 'Омежка', 'Шайлушай', 'Дединсайд', 'Гойда', 'Глэк', 'Тапальщик', 'Хомяк', 'Вумен', 'Краш', 'Кринж', 'Базированный', 'Симп', 'Штрих'];
        const generateName = () => CRINGE_NAMES[Math.floor(Math.random() * CRINGE_NAMES.length)];
        const generateColor = () => ['bg-amber-700', 'bg-blue-700', 'bg-emerald-700', 'bg-fuchsia-700', 'bg-rose-700', 'bg-cyan-700'][Math.floor(Math.random() * 6)];

        const getTheme = (type) => {
          switch(type) {
            case 'living': return { bg: 'bg-stone-800/60', border: 'border-stone-600/50', dweller: 'bg-stone-400', icon: Users, color: 'text-stone-300', name: 'Жилой Блок' };
            case 'generator': return { bg: 'bg-red-950/20', border: 'border-red-900/40', dweller: 'bg-red-500', icon: Zap, color: 'text-yellow-500', name: 'Дизель' };
            case 'filter': return { bg: 'bg-blue-950/20', border: 'border-blue-900/40', dweller: 'bg-blue-500', icon: Wind, color: 'text-stone-400', name: 'ФВУ' };
            case 'reservoir': return { bg: 'bg-cyan-950/20', border: 'border-cyan-900/40', dweller: 'bg-cyan-500', icon: Droplet, color: 'text-cyan-500', name: 'Очистная' };
            case 'farm': return { bg: 'bg-amber-950/20', border: 'border-amber-900/40', dweller: 'bg-amber-600', icon: Sprout, color: 'text-amber-500', name: 'Грибница' };
            case 'medbay': return { bg: 'bg-stone-300/10', border: 'border-stone-400/40', dweller: 'bg-stone-100', icon: Heart, color: 'text-red-500', name: 'Медпункт' };
            case 'bar': return { bg: 'bg-purple-950/20', border: 'border-purple-900/40', dweller: 'bg-purple-500', icon: Martini, color: 'text-purple-400', name: 'Бар' };
            case 'armory': return { bg: 'bg-slate-800/40', border: 'border-slate-600/60', dweller: 'bg-slate-400', icon: Swords, color: 'text-stone-300', name: 'Оружейная' };
            case 'warehouse': return { bg: 'bg-stone-700/20', border: 'border-stone-500/40', dweller: 'bg-stone-400', icon: Database, color: 'text-stone-400', name: 'Склад' };
            case 'lab': return { bg: 'bg-indigo-950/20', border: 'border-indigo-900/40', dweller: 'bg-indigo-400', icon: FlaskConical, color: 'text-indigo-400', name: 'Лаборатория' };
            case 'garage': return { bg: 'bg-stone-900/40', border: 'border-stone-500/50', dweller: 'bg-stone-600', icon: CarFront, color: 'text-stone-400', name: 'Гараж' };
            case 'turret': return { bg: 'bg-slate-900/60', border: 'border-slate-600/80', dweller: 'bg-slate-600', icon: Crosshair, color: 'text-red-500', name: 'Турель' };
            case 'radio': return { bg: 'bg-teal-950/30', border: 'border-teal-800/50', dweller: 'bg-teal-500', icon: Radio, color: 'text-teal-400', name: 'Радиорубка' };
            case 'guard': return { bg: 'bg-green-950/30', border: 'border-green-800/50', dweller: 'bg-green-600', icon: Shield, color: 'text-green-500', name: 'Караулка' };
            case 'project': return { bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-500/80', dweller: 'bg-fuchsia-400', icon: Rocket, color: 'text-fuchsia-400', name: 'Проект Исход' };
            default: return { bg: 'bg-stone-800/40', border: 'border-stone-600/50', dweller: 'bg-stone-500', icon: Activity, color: 'text-stone-500', name: 'Отсек' };
          }
        };

        const getBestSkill = (skills) => {
          let best = 'none', max = 4;
          Object.entries(skills).forEach(([s, v]) => { if (v > max) { max = v; best = s; } });
          return best;
        };

        const createDweller = (roomId = null, isCompanion = false, type = 'dog') => {
          if (isCompanion) return { id: 'c' + Date.now() + Math.random(), name: type === 'dog' ? 'Пёсель' : 'Дрон', isCompanion: true, trait: type, roomId };
          return {
            id: 'd' + Date.now() + Math.random(),
            name: type === 'leader' ? 'Командир' : generateName(), 
            trait: type === 'leader' ? 'leader' : TRAITS[Math.floor(Math.random() * 4)].id,
            roomId, isSick: false, isCyborg: false, isMutant: false, sickTicks: 0,
            morale: type === 'leader' ? 100 : 80 + Math.random() * 20, 
            equipped: null, color: generateColor(),
            skills: { generator: 1, filter: 1, reservoir: 1, farm: 1, bar: 1, armory: 1, lab: 1, garage: 1, turret: 1, radio: 1, guard: 1 },
            exp: { generator: 0, filter: 0, reservoir: 0, farm: 0, bar: 0, armory: 0, lab: 0, garage: 0, turret: 0, radio: 0, guard: 0 }
          };
        };

        const getInitialState = () => ({
            resources: { water: 50, energy: 50, air: 50, mushrooms: 50, vodka: 10, science: 0, droneParts: 0, weapons: 2, armor: 0, stimpaks: 0, emp: 0, traps: 0 },
            rooms: [
              { id: 'liv1', type: 'living', name: 'Жилой Блок', level: 1, status: 'normal' },
              { id: 'gen1', type: 'generator', name: 'Дизель', level: 1, status: 'normal' },
              { id: 'fil1', type: 'filter', name: 'ФВУ', level: 1, status: 'normal' },
              { id: 'res1', type: 'reservoir', name: 'Очистная', level: 1, status: 'normal' },
              { id: 'frm1', type: 'farm', name: 'Грибница', level: 1, status: 'normal' },
              { id: 'med1', type: 'medbay', name: 'Медпункт', level: 1, status: 'normal' }
            ],
            dwellers: [createDweller('liv1', false, 'leader'), createDweller('gen1'), createDweller('frm1')],
            queue: [],
            squadSelection: [],
            vehicles: { motorcycle: 0, handcar: 0, jeep: 0, mech: 0 },
            selectedVehicle: 'none',
            expedition: null,
            pendingReport: null,
            season: { type: 'normal', timer: 60 },
            storm: { active: false, nextIn: 25, duration: 0 },
            safeSurface: false,
            isBlackout: false,
            ufo: { active: false, hp: 0, timer: 0 },
            ufoSpawnTimer: 40,
            breach: { active: false, timer: 0, strength: 0, isRaiders: false },
            raiders: { active: false, demand: { water: 0, weapons: 0 }, timer: 0, strength: 0 },
            unlockedTech: { warehouse: false, bar: false, armory: false, garage: false, turret: false, radio: false, guard: false, project: false },
            merchant: { active: false, timer: 60, rates: {} },
            policies: { rations: false, labor: false, isolation: false },
            factions: { hansa: 0, sparta: 0 },
            commander: { xp: 0, level: 1, perks: [] },
            endgame: { active: false, timer: 0, won: false },
            boss: { active: false, hp: 2000, laserTimer: 0 },
            gracePeriod: 90,
            questTimer: 120,
            logs: ['Убежище 42: Система запущена.'],
            tickSpeed: DEFAULT_TICK_RATE,
            tutorialStep: 0,
            gameOver: { active: false, reason: '' }
        });

        // --- УТИЛИТЫ СТЕЙТА ---
        const addLog = (state, msg) => {
            state.logs.unshift(msg);
            if (state.logs.length > 20) state.logs.pop();
        };

        // --- UI КОМПОНЕНТЫ ---
        const RobotMedic = ({ isPaused = false }) => {
          const [pos, setPos] = useState({ x: 50, dir: 1 });
          useEffect(() => {
            if (isPaused) return;
            const moveInterval = setInterval(() => { setPos(prev => { const newX = Math.floor(Math.random() * 60) + 20; return { x: newX, dir: newX > prev.x ? 1 : -1 }; }); }, 4000);
            return () => clearInterval(moveInterval);
          }, [isPaused]);
          return (
            <div className="absolute bottom-0 flex flex-col items-center justify-end transition-all duration-[4000ms] ease-linear z-10 pointer-events-none" style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}>
              <div className="flex flex-col items-center transition-transform duration-150" style={{ transform: `scaleX(${pos.dir})` }}>
                <div className="w-4 h-4 bg-stone-300 rounded-t-full border border-stone-500 relative flex justify-center"><div className="w-2 h-1 bg-cyan-400 absolute top-1.5 rounded-full animate-pulse" /></div>
                <div className="w-6 h-5 bg-stone-200 rounded-sm border border-stone-400 flex justify-center items-center relative">
                   <span className="text-[9px] text-red-500 font-bold">+</span>
                   <div className="absolute -left-1.5 top-1 w-1.5 h-3 bg-stone-400 rounded-sm" /><div className="absolute -right-1.5 top-1 w-1.5 h-3 bg-stone-400 rounded-sm" />
                </div>
                <div className="w-3 h-1.5 bg-stone-500 rounded-b-sm" />
              </div>
            </div>
          );
        };

        const Companion = ({ type, isPaused }) => {
          const [pos, setPos] = useState({ x: 50, dir: 1 });
          useEffect(() => {
            if (isPaused) return;
            const moveInterval = setInterval(() => { setPos(prev => { const newX = Math.floor(Math.random() * 80) + 10; return { x: newX, dir: newX > prev.x ? 1 : -1 }; }); }, type==='dog'?3000:5000);
            return () => clearInterval(moveInterval);
          }, [isPaused, type]);

          if (type === 'dog') {
            return (
              <div className="absolute bottom-0 flex flex-col items-center justify-end transition-all duration-[3000ms] ease-linear z-10 pointer-events-none" style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}>
                <div className="flex items-end transition-transform duration-150" style={{ transform: `scaleX(${pos.dir})` }}>
                  <div className="w-2 h-3 bg-amber-800 rounded-l-full relative"><div className="absolute top-0 right-0 w-1 h-2 bg-amber-900 rounded-t-full -rotate-45" /></div>
                  <div className="w-4 h-2 bg-amber-700 rounded-r-sm"></div>
                </div>
              </div>
            );
          } else if (type === 'drone') {
            return (
              <div className="absolute bottom-2 flex flex-col items-center justify-end transition-all duration-[5000ms] ease-linear z-10 animate-bounce pointer-events-none" style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}>
                <div className="w-3 h-3 bg-stone-400 rounded-full border border-stone-600 flex items-center justify-center relative">
                   <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                   <div className="absolute -top-1 w-0.5 h-1 bg-stone-500" />
                </div>
              </div>
            );
          }
          return null;
        }

        const Dweller = ({ dweller, isOutside = false, colorClass = 'bg-stone-500', isPaused = false, roomType = 'none', isSelected = false, onClick = null }) => {
          const [pos, setPos] = useState({ x: Math.floor(Math.random() * 80) + 10, dir: Math.random() > 0.5 ? 1 : -1 });
          const [isDragging, setIsDragging] = useState(false);

          useEffect(() => { setPos(prev => { const newX = Math.floor(Math.random() * 80) + 10; return { x: newX, dir: newX > prev.x ? 1 : -1 }; }); }, [dweller.roomId]);

          useEffect(() => {
            if (isDragging || isPaused) return;
            const moveInterval = setInterval(() => { setPos(prev => { const newX = Math.floor(Math.random() * 80) + 10; return { x: newX, dir: newX > prev.x ? 1 : -1 }; }); }, 6000 + Math.random() * 3000);
            return () => clearInterval(moveInterval);
          }, [isDragging, isPaused]);

          if (dweller.isCompanion) return <Companion type={dweller.trait} isPaused={isPaused} />;

          const isMutant = dweller.isMutant;
          const isLeader = dweller.trait === 'leader';
          const traitIcon = isMutant ? (TRAITS.find(t => t.id === dweller.trait)?.icon || '🧟') : (TRAITS.find(t => t.id === dweller.trait)?.icon || '😐');
          const bodyColor = isLeader ? 'bg-yellow-700' : isMutant ? 'bg-lime-500' : dweller.isSick ? 'bg-green-800' : dweller.isCyborg ? 'bg-slate-700' : colorClass;
          const headColor = isMutant ? 'bg-lime-400' : dweller.isSick ? 'bg-green-600' : 'bg-orange-200';
          const bestSkill = getBestSkill(dweller.skills);

          return (
            <div
              onClick={onClick}
              draggable={!isOutside}
              onDragStart={(e) => { setIsDragging(true); e.dataTransfer.setData('dwellerId', dweller.id); }}
              onDragEnd={() => setIsDragging(false)}
              className={`group absolute bottom-0 flex flex-col items-center justify-end transition-all duration-[6000ms] ease-linear z-20 pointer-events-auto ${dweller.isSick ? 'opacity-60' : ''} ${!isOutside ? 'cursor-pointer active:scale-95 hover:z-30' : ''} ${isSelected ? 'ring-2 ring-white rounded-sm scale-110 z-40' : ''}`}
              style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold text-stone-200 bg-black/90 px-1.5 py-0.5 rounded mb-1 whitespace-nowrap max-w-[60px] truncate text-center block absolute bottom-full pointer-events-none z-30">
                {traitIcon} {dweller.name}
              </span>
              {dweller.morale < 30 && !isOutside && !dweller.isCyborg && !isMutant && <div className="absolute -top-4 text-[10px] animate-bounce pointer-events-none">🤬</div>}
              
              <div className="flex flex-col items-center justify-end transition-transform duration-150 pointer-events-none" style={{ transform: `scaleX(${pos.dir})` }}>
                <div className={`w-3 h-3 ${dweller.isCyborg ? 'rounded bg-slate-500 border border-cyan-500' : 'rounded-full'} mb-0.5 relative ${headColor} ${isMutant ? 'shadow-[0_0_10px_#84cc16]' : ''}`}>
                   {isOutside && !dweller.isCyborg && <div className="absolute top-0.5 -right-0.5 w-1.5 h-1.5 bg-stone-800 rounded-full border border-stone-900" />}
                   {dweller.isCyborg && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
                   
                   {/* Профессии (Шляпы) */}
                   {isLeader && <div className="absolute -top-2 left-0 w-3 h-2 bg-yellow-400 rounded-t-sm flex justify-around"><div className="w-0.5 h-1 bg-amber-600"></div><div className="w-0.5 h-1 bg-amber-600"></div></div>}
                   {!isMutant && !isLeader && roomType === 'guard' && <div className="absolute -top-1 left-0 w-3 h-1.5 bg-green-900 rounded-t-full"></div>}
                   {!isMutant && !isLeader && roomType !== 'guard' && bestSkill === 'generator' && <div className="absolute -top-1.5 left-0 w-3 h-1.5 bg-yellow-500 rounded-t-full"></div>}
                   {!isMutant && !isLeader && roomType !== 'guard' && bestSkill === 'farm' && <div className="absolute -top-1 -left-0.5 w-4 h-1 bg-amber-200 rounded-full"></div>}
                   {!isMutant && !isLeader && roomType !== 'guard' && bestSkill === 'medbay' && <div className="absolute -top-0.5 left-0 w-3 h-1 bg-white flex justify-center"><div className="w-0.5 h-1 bg-red-500"></div></div>}
                   {!isMutant && !isLeader && roomType !== 'guard' && bestSkill === 'armory' && <div className="absolute -top-1 left-0 w-3 h-2 bg-stone-800 rounded-t-full"></div>}
                   {!isMutant && !isLeader && roomType !== 'guard' && bestSkill === 'lab' && <div className="absolute top-0.5 left-0.5 w-2 h-0.5 bg-stone-900"></div>}
                </div>
                <div className={`w-[18px] h-6 rounded-t-sm ${bodyColor} relative border ${dweller.isCyborg ? 'border-cyan-900' : 'border-stone-800'} flex justify-center`}>
                  <div className={`absolute -left-1 top-1 w-1.5 h-3 ${dweller.isCyborg ? 'bg-slate-800' : 'bg-stone-700'} rounded-sm border ${dweller.isCyborg ? 'border-cyan-900' : 'border-stone-900'}`} />
                  {dweller.equipped === 'weapon' && <div className="absolute -right-1.5 top-1 w-1 h-[18px] bg-stone-300 rotate-12" />}
                  {dweller.equipped === 'armor' && <div className="absolute inset-0 bg-stone-600/50 border border-stone-400 rounded-t-sm" />}
                  {dweller.equipped === 'stimpak' && <div className="absolute -right-1.5 top-2 w-1.5 h-1.5 bg-green-500 rounded-full" />}
                </div>
              </div>
            </div>
          );
        };

        const ExpeditionView = ({ expedition, dwellers, isPaused = false }) => {
          const [action, setAction] = useState('walk'); 
          const [pos, setPos] = useState({ x: 50, dir: 1 });

          useEffect(() => {
            if (isPaused) return;
            const actInterval = setInterval(() => {
              const r = Math.random();
              if (r < 0.4) setAction('shoot'); else if (r < 0.7) setAction('dig');
              else { setAction('walk'); setPos(prev => { const newX = Math.floor(Math.random() * 80) + 10; return { x: newX, dir: newX > prev.x ? 1 : -1 }; }); }
            }, 5000);
            return () => clearInterval(actInterval);
          }, [isPaused]);

          const v = expedition.vehicle;
          if (v && v !== 'none') {
            const icons = { handcar: '🚜', motorcycle: '🏍️', jeep: '🚙', mech: '🤖' };
            return (
              <div className="absolute bottom-1 flex flex-col items-center justify-end transition-all duration-[3000ms] ease-linear z-10 pointer-events-none" style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}>
                 <div className="text-3xl sm:text-4xl drop-shadow-md transition-transform duration-150" style={{ transform: `scaleX(${pos.dir})` }}>
                    {icons[v]}
                 </div>
              </div>
            );
          }

          return (
            <div className="absolute bottom-0 flex items-end gap-1 transition-all duration-[5000ms] ease-linear z-10 pointer-events-none" style={{ left: `${pos.x}%`, transform: 'translateX(-50%)' }}>
              {expedition.squad.map((id, i) => {
                const d = dwellers.find(dw => dw.id === id);
                if (!d) return null;
                const headColor = d.isMutant ? 'bg-lime-400' : d.isSick ? 'bg-green-600' : 'bg-orange-200';
                const bodyColor = d.trait === 'leader' ? 'bg-yellow-700' : d.isMutant ? 'bg-lime-500' : d.isSick ? 'bg-green-800' : d.isCyborg ? 'bg-slate-700' : (d.color || 'bg-stone-500');

                return (
                  <div key={d.id} className="relative flex flex-col items-center transition-transform duration-150" style={{ transform: `scaleX(${pos.dir})` }}>
                    <div className={`w-3 h-3 ${d.isCyborg ? 'rounded bg-slate-500 border border-cyan-500' : 'rounded-full'} mb-0.5 relative ${headColor}`}>
                      {!d.isCyborg && <div className="absolute top-0.5 -right-0.5 w-1.5 h-1.5 bg-stone-800 rounded-full border border-stone-900" />}
                      {d.trait === 'leader' && <div className="absolute -top-2 left-0 w-3 h-2 bg-yellow-400 rounded-t-sm flex justify-around"><div className="w-0.5 h-1 bg-amber-600"></div><div className="w-0.5 h-1 bg-amber-600"></div></div>}
                    </div>
                    <div className={`w-[18px] h-6 rounded-t-sm ${bodyColor} relative flex justify-center`}>
                      <div className="absolute -left-1 top-0.5 w-2 h-4 bg-stone-700 rounded-sm border border-stone-900" /> 
                      {d.equipped === 'weapon' && action === 'shoot' && i === 0 && <div className="absolute top-1.5 -right-4 w-4 h-1 bg-stone-400"><div className="absolute -right-3 -top-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" /></div>}
                      {action === 'dig' && i === 0 && <div className="absolute -bottom-1 -right-4 w-4 h-4 bg-stone-600 border border-stone-800 rounded-sm flex items-center justify-center"><span className="text-[6px]">📦</span></div>}
                      {d.equipped === 'armor' && <div className="absolute inset-0 bg-stone-600/50 border border-stone-400 rounded-t-sm" />}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        };

        // --- ЕДИНЫЙ ИГРОВОЙ ТИК ---
        const simulateTick = (prevState) => {
            const state = structuredClone(prevState);

            if (state.gameOver.active || state.endgame.won) return state;

            // Проверка Лидера
            const leaderAlive = state.dwellers.some(d => d.trait === 'leader' && !d.dead);
            if (!leaderAlive) {
               state.gameOver = { active: true, reason: 'Командир Базы погиб в бою. Без лидера дисциплина рухнула, и убежище пало.' };
               return state;
            }

            // ОБУЧЕНИЕ
            if (state.tutorialStep === 0 && state.dwellers.some(d => d.roomId === state.rooms.find(r=>r.type==='generator')?.id)) {
                state.tutorialStep = 1; addLog(state, "💡 Совет: Энергия пошла! Теперь строим 'Очистную' и 'Грибницу'.");
            } else if (state.tutorialStep === 1 && state.rooms.some(r=>r.type==='reservoir') && state.rooms.some(r=>r.type==='farm')) {
                state.tutorialStep = 2; addLog(state, "💡 Совет: Отлично. Открой 'Управление' и отправь экспедицию на Руины.");
            } else if (state.tutorialStep === 2 && state.expedition) {
                state.tutorialStep = 3; addLog(state, "💡 Совет: Отряд в пути. Изучай Оружейную за очки Науки (🔬)!");
            } else if (state.tutorialStep === 3 && state.unlockedTech.armory) {
                state.tutorialStep = 4; addLog(state, "💡 Обучение пройдено! Твоя цель — выжить и активировать 'Проект Исход'!");
            }

            // ОПЫТ КОМАНДИРА
            state.commander.xp += 1;
            if (state.commander.xp >= state.commander.level * 100) {
                state.commander.xp -= state.commander.level * 100;
                state.commander.level++;
                addLog(state, '⭐ Командир получил новый уровень! Доступен новый перк.');
            }

            // ФИНАЛЬНЫЙ БОСС
            if (state.boss.active) {
                let autoDmg = 0;
                state.rooms.filter(r => r.type === 'turret' && r.status === 'normal' && !state.isBlackout).forEach(r => {
                    if (state.dwellers.some(d => d.roomId === r.id && !d.isSick && !d.isCompanion)) {
                        autoDmg += r.level * (state.commander.perks.includes('turrets') ? 10 : 5);
                    }
                });
                state.boss.hp -= autoDmg;

                if (state.boss.hp <= 0) {
                    state.commander.xp += 500;
                    state.endgame.won = true;
                    state.boss.active = false;
                    return state;
                }

                state.boss.laserTimer++;
                if (state.boss.laserTimer >= 8) {
                    state.boss.laserTimer = 0;
                    const validRooms = state.rooms.filter(r => r.status === 'normal' && r.type !== 'project');
                    if (validRooms.length > 0) {
                        const target = validRooms[Math.floor(Math.random() * validRooms.length)];
                        const isFire = Math.random() > 0.5;
                        addLog(state, `☄️ ЛАЗЕР КОРАБЛЯ УДАРИЛ ПО БАЗЕ! ${target.name} ${isFire ? 'в огне!' : 'разрушена!'}`);
                        target.status = isFire ? 'fire' : 'broken';
                    }
                }
            }

            // СЕЗОНЫ
            state.season.timer--;
            if (state.season.timer <= 0) {
                const nextTypes = ['normal', 'normal', 'winter', 'acid'];
                const next = nextTypes[Math.floor(Math.random() * nextTypes.length)];
                if (next === 'winter') addLog(state, '❄️ ВНИМАНИЕ: Началась Ядерная Зима! Расход топлива x2, урожай ферм снижен.');
                else if (next === 'acid') addLog(state, '🌧️ ВНИМАНИЕ: Сезон Кислотных Дождей! Вылазки стали смертельно опасны.');
                else if (state.season.type !== 'normal') addLog(state, '🌤️ Погода нормализовалась.');
                state.season = { type: next, timer: Math.floor(Math.random() * 60) + 120 };
            }

            if (state.gracePeriod > 0) state.gracePeriod--;
            
            // ПРОРЫВ И РЕЙДЕРЫ
            if (state.raiders.active) {
                state.raiders.timer--;
                if (state.raiders.timer <= 0) {
                    addLog(state, `⚔️ Время вышло! Рейдеры идут на штурм!`);
                    state.breach = { active: true, timer: 5, strength: state.raiders.strength, isRaiders: true };
                    state.raiders.active = false;
                }
            }

            if (state.breach.active) {
                let defense = Math.floor(state.factions.sparta / 10);
                if (state.resources.traps > 0) {
                    state.resources.traps--;
                    addLog(state, `🪤 Ловушка сработала! Урон врагам.`);
                    state.breach.strength = Math.max(0, state.breach.strength - 2);
                }

                const guards = state.dwellers.filter(d => d.roomId && state.rooms.find(r => r.id === d.roomId)?.type === 'guard' && !d.isSick && !d.isCompanion);
                const others = state.dwellers.filter(d => d.roomId !== 'surface' && !d.isSick && !d.isCompanion && state.rooms.find(r => r.id === d.roomId)?.type !== 'guard');
                
                [...guards, ...others].forEach(d => {
                    if (d.equipped === 'weapon') defense += 1;
                    if (d.equipped === 'armor') defense += 2;
                    if (d.trait === 'mutant_combat') defense += 3;
                });
                
                state.rooms.filter(r => r.type === 'turret' && r.status === 'normal' && !state.isBlackout).forEach(r => {
                    if (state.dwellers.some(d => d.roomId === r.id && !d.isSick && !d.isCompanion)) {
                        defense += 3 * r.level * (state.commander.perks.includes('turrets') ? 2 : 1);
                    }
                });
                defense += state.dwellers.filter(d => d.isCompanion && d.trait === 'drone').length * 2;
                
                if (defense >= state.breach.strength) {
                    addLog(state, state.breach.isRaiders ? `🛡️ Рейдеры отбиты! (+1 Оружие)` : `🛡️ Дроны уничтожены! (+1 Оружие, +1 Деталь)`);
                    state.resources.weapons++;
                    if (!state.breach.isRaiders) state.resources.droneParts++;
                    state.commander.xp += 10;
                    state.breach.active = false;
                } else {
                    state.breach.timer--;
                    if (state.breach.timer <= 0) {
                        addLog(state, state.breach.isRaiders ? `💀 ВРАГ ПРОРВАЛСЯ! Рейдеры убивают и грабят Склады!` : `💀 ВРАГ ПРОРВАЛСЯ! Дроны убили защитников!`);
                        
                        let targets = state.dwellers.filter(d => d.roomId && state.rooms.find(r => r.id === d.roomId)?.type === 'guard' && !d.isSick && !d.isCompanion);
                        if (targets.length === 0) targets = state.dwellers.filter(d => !d.isSick && d.roomId !== 'surface' && !d.isCompanion);
                        
                        if (targets.length > 0) {
                            const victim = targets[Math.floor(Math.random() * targets.length)];
                            if (victim.equipped === 'armor') {
                                addLog(state, `🛡️ Броня спасла ${victim.name}, но была уничтожена.`);
                                victim.equipped = null;
                            } else {
                                addLog(state, `💀 ${victim.name} пал смертью храбрых.`);
                                victim.dead = true;
                            }
                        }
                        state.dwellers = state.dwellers.filter(d => !d.dead);
                        
                        if (state.breach.isRaiders) {
                            state.resources.water = 0; state.resources.mushrooms = 0; state.resources.weapons = Math.max(0, state.resources.weapons - 2);
                        } else {
                            state.resources.energy = Math.max(0, state.resources.energy - 30); state.resources.mushrooms = Math.max(0, state.resources.mushrooms - 30);
                        }
                        state.breach.active = false;
                    }
                }
            }

            // НЛО ПАТРУЛЬ
            if (state.ufo.active) {
                let autoDmg = 0;
                state.rooms.filter(r => r.type === 'turret' && r.status === 'normal' && !state.isBlackout).forEach(r => {
                    if (state.dwellers.some(d => d.roomId === r.id && !d.isSick && !d.isCompanion)) autoDmg += r.level * (state.commander.perks.includes('turrets') ? 2 : 1);
                });
                
                if (autoDmg > 0) {
                    state.ufo.hp -= autoDmg;
                    if (state.ufo.hp <= 0) {
                        addLog(state, '💥 Турели сбили Дрона! (+1 Оружие, +10 Тп, +1 Деталь).');
                        state.resources.weapons++; state.resources.energy += 10; state.resources.droneParts++;
                        state.ufo.active = false;
                    }
                } else {
                    state.ufo.timer--;
                    if (state.ufo.timer <= 0) {
                        addLog(state, '🛸 Дрон улетел.');
                        state.ufo.active = false;
                    }
                }
            } else if (!state.breach.active && !state.boss.active && !state.raiders.active && !state.policies.isolation) {
                state.ufoSpawnTimer--;
                if (state.ufoSpawnTimer <= 0) {
                    state.ufoSpawnTimer = 45;
                    state.queue = []; 
                    const rand = Math.random();
                    if (rand > 0.8 && state.rooms.length > 5) {
                        const str = Math.floor(state.dwellers.filter(d=>!d.isCompanion).length / 2) + 2;
                        state.raiders = { active: true, demand: { water: 30 * Math.floor(state.rooms.length/3), weapons: Math.floor(state.rooms.length / 4) + 1 }, timer: 20, strength: str };
                        addLog(state, '🏴‍☠️ РЕЙДЕРЫ у ворот! Требуют дань!');
                    } else if (rand > 0.5 && state.rooms.length > 3) {
                        addLog(state, '🚨 ПРОРЫВ ШЛЮЗА! Дроны атакуют!');
                        state.breach = { active: true, strength: Math.floor(state.dwellers.filter(d=>!d.isCompanion).length / 3) + 1, timer: 5, isRaiders: false };
                    } else {
                        addLog(state, '🛸 ПАТРУЛЬ ДРОНОВ! Жмите на НЛО!');
                        state.ufo = { active: true, hp: 4, timer: 5 };
                    }
                }
            }

            // ТОРГОВЕЦ
            if (state.merchant.active) {
                state.merchant.timer--;
                if (state.merchant.timer <= 0) {
                    addLog(state, '🎒 Караван ушел.');
                    state.merchant.active = false; state.merchant.timer = 100;
                }
            } else if (!state.policies.isolation) {
                state.merchant.timer--;
                if (state.merchant.timer <= 0) {
                    addLog(state, '🎒 К вратам прибыл караванщик!');
                    state.merchant = { active: true, timer: 30, rates: { buyEnergy: Math.floor(Math.random()*3)+2, buyAir: Math.floor(Math.random()*3)+2, buyWeapon: Math.floor(Math.random()*10)+15 } };
                }
            }

            // БУРЯ
            if (state.storm.active) {
                state.storm.duration--;
                if (state.storm.duration <= 0) {
                    addLog(state, '🌤️ Ионная буря утихла.');
                    state.storm = { active: false, nextIn: Math.floor(Math.random() * 20) + 40, duration: 0 };
                }
            } else {
                state.storm.nextIn--;
                if (state.storm.nextIn <= 0 || (state.boss.active && Math.random() < 0.1)) {
                    addLog(state, '🌪️ ВНИМАНИЕ: Ионная буря!');
                    state.storm = { active: true, nextIn: 0, duration: state.boss.active ? 30 : 15 };
                }
            }

            // ЭКСПЕДИЦИИ
            if (state.expedition) {
                state.expedition.time--;
                if (state.expedition.time <= 0) {
                    const leader = state.dwellers.find(d => d.id === state.expedition.squad[0]);
                    const livingRoomId = state.rooms.find(r => r.type === 'living')?.id || state.rooms[0].id;
                    
                    if (Math.random() < 0.1) {
                        addLog(state, `🐕 Сталкеры привели щенка с Поверхности!`);
                        state.dwellers.push(createDweller(livingRoomId, true, 'dog'));
                    }

                    Object.keys(state.expedition.loot).forEach(k => state.resources[k] += state.expedition.loot[k]);
                    state.dwellers.forEach(dw => { if (state.expedition.squad.includes(dw.id)) dw.roomId = livingRoomId; });
                    
                    if (state.expedition.vehicle !== 'none') state.vehicles[state.expedition.vehicle]++;
                    state.commander.xp += 20;

                    addLog(state, `📥 Отряд вернулся! Принесено Воды: ${state.expedition.loot.water}, Тп: ${state.expedition.loot.energy}`);
                    
                    state.pendingReport = {
                        name: leader?.name || "Сталкер",
                        loot: state.expedition.loot,
                        isSick: state.expedition.isSickEvent || false,
                        weaponSaved: state.expedition.weaponSavedEvent || false
                    };

                    state.expedition = null;
                } else {
                    const loc = LOCATIONS[state.expedition.location] || LOCATIONS.ruins;
                    if (Math.random() < 0.4 + (0.1 * state.expedition.squad.length)) {
                        const type = loc.types[Math.floor(Math.random() * loc.types.length)];
                        state.expedition.loot[type] += Math.floor((Math.random() * 10 + 5) * loc.lootMult);
                    }
                    
                    if (!state.expedition.isSafe) {
                        let sickRisk = (state.storm.active && state.expedition.vehicle !== 'mech' ? 0.30 : 0.08) * loc.risk;
                        let deathRisk = (state.storm.active && state.expedition.vehicle !== 'mech' ? 0.15 : 0.03) * loc.risk;
                        if (state.season.type === 'acid' && state.expedition.vehicle !== 'mech') { sickRisk *= 2; deathRisk *= 1.5; } 

                        let vehicleSurvived = true;
                        state.expedition.squad.forEach(id => {
                            const dw = state.dwellers.find(d => d.id === id);
                            if (!dw) return;
                            let rSick = sickRisk; let rDeath = deathRisk;
                            if (dw.trait === 'gigachad') { rDeath /= 3; rSick /= 2; }

                            if (!dw.isSick && Math.random() < rSick) {
                                if (dw.equipped === 'stimpak') { dw.equipped = null; addLog(state, `💉 Стимпак спас ${dw.name} от радиации!`); }
                                else if (dw.equipped === 'armor' && Math.random() < 0.5) { dw.equipped = null; addLog(state, `🛡️ Броня спасла ${dw.name} от облучения!`); }
                                else { dw.isSick = true; state.expedition.isSickEvent = true; addLog(state, state.storm.active ? `☢️ ${dw.name} облучен!` : `☢️ ${dw.name} ранен.`); }
                            }
                            
                            if (Math.random() < rDeath) {
                                if (dw.equipped === 'armor') { dw.equipped = null; state.expedition.weaponSavedEvent = true; addLog(state, `🛡️ Броня ${dw.name} уничтожена в бою.`); }
                                else if (dw.equipped === 'weapon') { dw.equipped = null; state.expedition.weaponSavedEvent = true; addLog(state, `🔫 ${dw.name} потерял оружие.`); }
                                else { 
                                    addLog(state, `💀 СВЯЗЬ ПОТЕРЯНА. ${dw.name} погиб.`); dw.dead = true; 
                                    if (vehicleSurvived && state.expedition.vehicle !== 'none' && Math.random() < 0.3) {
                                        vehicleSurvived = false; addLog(state, `💥 Транспорт (${state.expedition.vehicle}) уничтожен!`);
                                    }
                                }
                            }
                        });
                        state.dwellers = state.dwellers.filter(d => !d.dead);
                        state.expedition.squad = state.expedition.squad.filter(id => state.dwellers.some(d => d.id === id));
                        if (!vehicleSurvived) state.expedition.vehicle = 'none';
                        if (state.expedition.squad.length === 0) { addLog(state, `💀 ВЕСЬ ОТРЯД УНИЧТОЖЕН.`); state.expedition = null; }
                    }
                }
            }

            // БЕЖЕНЦЫ И ОЧЕРЕДЬ
            if (!state.storm.active && !state.ufo.active && !state.breach.active && !state.policies.isolation && Math.random() < QUEUE_CHANCE && state.queue.length < 3) {
                state.queue.push(createDweller());
                addLog(state, "🔔 У шлюза замечены выжившие.");
            }

            // РЕСУРСЫ И ЖИТЕЛИ
            let newBlackout = false;
            let newRiot = false;

            const humanDwellers = state.dwellers.filter(d => !d.isCompanion).length;
            const consumeMult = state.policies.rations ? 2 : 1;
            state.resources.water -= humanDwellers * 0.5 * consumeMult;
            state.resources.air -= humanDwellers * 0.5;
            if (state.policies.rations) state.resources.mushrooms -= humanDwellers * 0.5; 
            state.resources.energy -= state.dwellers.filter(d => d.isCyborg).length * 1; 

            if (state.resources.energy <= 0) {
                newBlackout = true;
                if (!state.isBlackout) addLog(state, `🔌 БЛЭКАУТ! Топливо закончилось! Системы обесточены!`);
            } else if (state.isBlackout && state.resources.energy > 0) {
                addLog(state, `⚡ Энергия восстановлена!`);
            }
            state.isBlackout = newBlackout;

            state.dwellers.forEach(d => {
                if (d.isCompanion) return;
                
                if (d.isCyborg) d.morale = 50; 
                if (d.isMutant || d.trait === 'leader') d.morale = 100;

                const room = state.rooms.find(r => r.id === d.roomId);
                
                if (d.isSick) {
                    d.sickTicks++;
                    if (d.sickTicks > 30 && !d.isCyborg && !d.isMutant && d.trait !== 'leader') {
                        d.isSick = false; d.isMutant = true;
                        addLog(state, `☢️ УЖАС! ${d.name} мутировал из-за болезни!`);
                    }
                }

                const hasDog = room && state.dwellers.some(o => o.roomId === room.id && o.trait === 'dog');
                const hasMutant = room && state.dwellers.some(o => o.roomId === room.id && o.isMutant && o.id !== d.id);
                
                if (hasDog && !d.isCyborg && !d.isMutant) d.morale = Math.min(100, d.morale + 1);
                if (hasMutant && !d.isMutant && !d.isCyborg) d.morale = Math.max(0, d.morale - 2);

                if (!room || d.roomId === 'surface') {
                    if (!d.isCyborg && !d.isMutant && d.trait !== 'leader') d.morale = Math.max(0, d.morale - 0.5);
                    return;
                }

                // Дроны чинят
                if (room.status === 'broken' || room.status === 'fire') {
                    if (state.dwellers.some(o => o.roomId === room.id && o.trait === 'drone') && Math.random() < 0.2) {
                        room.status = 'normal'; addLog(state, `🤖 Дрон починил отсек: ${room.name}`);
                    }
                }

                if (room.status === 'normal' && (!newBlackout || room.type === 'generator')) {
                    if (room.type === 'medbay' && d.isSick) {
                        if (state.resources.energy >= 20) { state.resources.energy -= 20; d.isSick = false; d.sickTicks = 0; addLog(state, `💊 Вылечен: ${d.name}`); }
                        if(!d.isCyborg && !d.isMutant && d.trait !== 'leader') d.morale = Math.min(100, d.morale + 1);
                    } else if (room.type === 'bar') {
                        const vodkaConsume = d.trait === 'skuf' ? 0.2 : 0.1;
                        const moraleGain = (d.trait === 'skuf' ? 12 : 6) * (state.policies.rations ? 1.5 : 1);
                        if (state.resources.vodka >= vodkaConsume) { if(!d.isCyborg && !d.isMutant && d.trait !== 'leader') d.morale = Math.min(100, d.morale + moraleGain); state.resources.vodka -= vodkaConsume; } 
                        else { if(!d.isCyborg && !d.isMutant && d.trait !== 'leader') d.morale = Math.min(100, d.morale + 1); }
                        d.exp.bar++;
                    } else if (room.type === 'living') {
                        if(!d.isCyborg && !d.isMutant && d.trait !== 'leader') d.morale = Math.min(100, d.morale + (state.policies.rations ? 4 : 2));
                    } else {
                        if(!d.isCyborg && !d.isMutant && d.trait !== 'leader') {
                            const moraleLoss = (d.trait === 'soy' ? 2 : 1) * (newBlackout ? 2 : 1) * (state.policies.labor ? 2 : 1);
                            d.morale = Math.max(0, d.morale - moraleLoss);
                        }
                        if (!d.isSick) {
                            d.exp[room.type]++;
                            if (d.exp[room.type] >= d.skills[room.type] * 20) {
                                d.skills[room.type]++; d.exp[room.type] = 0;
                                addLog(state, `⭐ ${d.name} теперь спец в отсеке: ${room.name}!`);
                            }
                        }
                    }
                } else if (newBlackout && !d.isCyborg && !d.isMutant && d.trait !== 'leader') {
                    d.morale = Math.max(0, d.morale - 2); 
                }

                // Бунты
                if (d.morale <= 0 && !d.isCyborg && !d.isMutant && d.roomId !== 'surface' && d.trait !== 'leader' && Math.random() < 0.05) {
                    if (room.status === 'normal') { newRiot = true; d.riotRoom = room.id; d.riotName = d.name; }
                }
            });

            // Работа Комнат
            state.rooms.forEach(room => {
                if (room.status === 'broken' || room.status === 'fire' || room.status === 'riot' || (newBlackout && room.type !== 'generator')) {
                    if (room.status === 'fire') state.resources.energy = Math.max(0, state.resources.energy - 2);
                    return;
                }
                
                // ЗАЧИСТКА МУТАНТОВ
                if (room.status === 'rats') {
                    const armedDefender = state.dwellers.find(d => d.roomId === room.id && d.equipped === 'weapon' && !d.isSick && !d.isCompanion && !d.dead);
                    if (armedDefender) {
                        room.status = 'normal';
                        addLog(state, `🔫 ${armedDefender.name} зачистил отсек ${room.name} от тварей!`);
                    } else {
                        state.resources.mushrooms = Math.max(0, state.resources.mushrooms - 5);
                    }
                    return; // пропускаем выработку ресурсов
                }

                const workers = state.dwellers.filter(d => d.roomId === room.id && !d.isSick && !d.isCompanion);
                let roomSkillSum = 0;
                workers.forEach(w => {
                    let skill = w.skills[room.type] || 1;
                    if (w.trait === 'skuf' && room.type === 'generator') skill += 1; 
                    if (w.isCyborg) skill *= 2; 
                    if (w.trait === 'mutant_worker' && (room.type === 'farm' || room.type === 'reservoir')) skill *= 3; 
                    if (w.trait === 'mutant_psi' && room.type === 'lab') skill *= 3; 
                    if (w.trait === 'leader') skill += 2;
                    const moraleMult = (w.isCyborg || w.isMutant || w.trait === 'leader') ? 1 : Math.max(0.2, (w.morale || 0) / 100);
                    roomSkillSum += skill * moraleMult;
                });
                
                let efficiency = (room.level + (roomSkillSum * room.level * 0.5)) * (state.policies.labor ? 1.5 : 1);
                if (state.season.type === 'winter' && room.type === 'farm') efficiency *= 0.5;

                if (room.type === 'generator') {
                    state.resources.energy += efficiency * 2;
                    if (state.storm.active && state.commander.perks.includes('storm_power')) state.resources.energy += 5; 
                }
                else if (room.type === 'filter') { if (state.resources.energy > 0) { state.resources.air += efficiency * 2; state.resources.energy -= room.level * (state.season.type === 'winter' ? 2 : 1); } }
                else if (room.type === 'reservoir') { if (state.resources.energy > 0) { state.resources.water += efficiency * 2; state.resources.energy -= room.level * (state.season.type === 'winter' ? 2 : 1); } }
                else if (room.type === 'farm') { if (state.resources.water > 0) { state.resources.mushrooms += efficiency * 1.5; state.resources.water -= room.level; } }
                else if (room.type === 'bar') { state.resources.vodka += efficiency * 0.2; }
                else if (room.type === 'lab') { if (state.resources.energy >= 1) { state.resources.science += efficiency * 0.2; state.resources.energy -= 0.5 * (state.season.type === 'winter' ? 2 : 1); } }
                else if (room.type === 'project') { state.resources.science += efficiency * 1; }
            });

            // Капы ресурсов
            let caps = { water: 100, energy: 100, air: 100, mushrooms: 100, vodka: 20, weapons: 10, armor: 10, stimpaks: 10, emp: 5, traps: 5, science: 100, droneParts: 10 };
            state.rooms.forEach(r => {
                if (r.type === 'warehouse' && r.status === 'normal') {
                    caps.water += r.level * 50; caps.energy += r.level * 50; caps.air += r.level * 50; caps.mushrooms += r.level * 50; caps.droneParts += r.level * 5;
                }
                if (r.type === 'project') { caps.energy += 1000; caps.science += 500; caps.droneParts += 20; }
            });

            if (state.resources.air <= 0 || state.resources.water <= 0) {
                state.gameOver = { active: true, reason: 'Жизнеобеспечение пало. Воздух или вода закончились.' };
            }
            
            Object.keys(caps).forEach(k => { state.resources[k] = Math.max(0, Math.min(state.resources[k] || 0, caps[k] || 9999)); });

            if (newRiot) {
                state.dwellers.forEach(d => {
                    if (d.riotRoom) {
                        const r = state.rooms.find(rm => rm.id === d.riotRoom);
                        if (r) { r.status = 'riot'; addLog(state, `🤬 БУНТ! ${d.riotName} заблокировал отсек!`); }
                        d.riotRoom = null; d.riotName = null;
                    }
                });
            }

            if (state.gracePeriod === 0 && Math.random() < (state.boss.active ? 0.20 : EVENT_CHANCE)) {
                const rCat = Math.random();
                if (rCat > 0.7) {
                    const validRooms = state.rooms.filter(r => r.status === 'normal' && r.type !== 'project');
                    if (validRooms.length > 0) {
                        const target = validRooms[Math.floor(Math.random() * validRooms.length)];
                        addLog(state, `🔥 ПОЖАР в отсеке: ${target.name}! Нужна вода!`);
                        target.status = 'fire';
                    }
                } else if (rCat > 0.4) {
                    const validRooms = state.rooms.filter(r => r.status === 'normal' && r.type !== 'project');
                    if (validRooms.length > 0) {
                        const target = validRooms[Math.floor(Math.random() * validRooms.length)];
                        addLog(state, `🐛 ${Math.random() > 0.5 ? 'МУТО-ПАУКИ' : 'МУТО-КРЫСЫ'} прорвались в: ${target.name}! Нужен боец с оружием!`);
                        target.status = 'rats';
                    }
                } else {
                    const healthy = state.dwellers.filter(d => !d.isSick && !d.isCyborg && !d.isMutant && !d.isCompanion);
                    if (healthy.length > 0) {
                        const target = healthy[Math.floor(Math.random() * healthy.length)];
                        addLog(state, `🦠 Инфекция: ${target.name} заболел.`);
                        target.isSick = true; target.sickTicks = 0;
                    }
                }
            }

            // Радиорубка (авто-события)
            if (!state.isBlackout) {
              const radioRoom = state.rooms.find(r => r.type === 'radio' && r.status === 'normal');
              if (radioRoom) {
                const radioWorkers = state.dwellers.filter(d => d.roomId === radioRoom.id && !d.isSick && !d.isCompanion);
                if (radioWorkers.length > 0) {
                   const gain = radioWorkers.reduce((acc, w) => acc + (w.skills.radio || 1), 0) * radioRoom.level;
                   if (Math.random() < gain * 0.005) { 
                      const r = Math.random();
                      if (r < 0.15) {
                         addLog(state, `🔊 [СЕКРЕТНЫЙ КАНАЛ]: Патрули ушли на дозаправку. Радар чист!`);
                         state.safeSurface = true;
                      } else if (r < 0.30 && !state.merchant.active && !state.policies.isolation) {
                         addLog(state, `🔊 [ТОРГОВАЯ ЧАСТОТА]: Караванщик на подходе.`);
                         state.merchant = { active: true, timer: 45, rates: { buyEnergy: 2, buyAir: 2, buyWeapon: 15 } };
                      }
                   }
                }
              }
            }

            return state;
        };

        // --- ОСНОВНОЙ КОМПОНЕНТ APP ---
        function App() {
          const [gameState, setGameState] = useState(getInitialState);
          
          // UI states
          const [hoveredRoomId, setHoveredRoomId] = useState(null);
          const [activeTab, setActiveTab] = useState('personnel'); 
          const [editingDweller, setEditingDweller] = useState(null);
          const [selectedDwellerId, setSelectedDwellerId] = useState(null);
          const [selectedEquip, setSelectedEquip] = useState(null);
          const [showTutorial, setShowTutorial] = useState(true);
          const [showDev, setShowDev] = useState(false);
          const [activeQuest, setActiveQuest] = useState(null);
          const [activeReport, setActiveReport] = useState(null); 
          const [isGeneratingReport, setIsGeneratingReport] = useState(false);

          // Centralized mutation wrapper
          const mutateState = useCallback((recipe) => {
              setGameState(prev => {
                  const next = structuredClone(prev);
                  recipe(next);
                  return next;
              });
          }, []);

          // Helper to trigger AI Quest outside of strict tick
          const handleAIQuest = async () => {
              mutateState(s => addLog(s, `⚠️ Аномальная активность в тоннелях...`));
              const text = await callGemini("Напиши интригующую ситуацию для сталкеров в метро (1-2 предл). Они нашли странный ящик или вагон.", 'quest');
              setActiveQuest({ text });
          };

          useEffect(() => {
            const timer = setInterval(() => {
                setGameState(prev => {
                    const next = structuredClone(prev);
                    if (next.questTimer <= 1 && !activeQuest && !next.boss.active && !next.policies.isolation && !activeReport) {
                        handleAIQuest();
                        next.questTimer = 120;
                    } else {
                        next.questTimer--;
                    }
                    return simulateTick(next);
                });
            }, gameState.tickSpeed);
            return () => clearInterval(timer);
          }, [gameState.tickSpeed, activeQuest, activeReport]);

          // AI Report hook
          useEffect(() => {
              if (gameState.pendingReport && !isGeneratingReport && !activeReport) {
                  const rep = gameState.pendingReport;
                  mutateState(s => { s.pendingReport = null; });
                  
                  setIsGeneratingReport(true);
                  callGemini(`Ты сталкер ${rep.name}. Вернулся с вылазки. Мрачный отчет (1-2 предл).`, 'report')
                      .then(text => {
                          setActiveReport({ name: rep.name, text, loot: rep.loot, isSick: rep.isSick, weaponSaved: rep.weaponSaved });
                      })
                      .catch(() => {
                          setActiveReport({ name: rep.name, text: "Чуть не сожрали. Забирайте хабар.", loot: rep.loot, isSick: rep.isSick, weaponSaved: rep.weaponSaved });
                      })
                      .finally(() => setIsGeneratingReport(false));
              }
          }, [gameState.pendingReport, isGeneratingReport, activeReport, mutateState]);

          // --- UI ACTIONS ---

          const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);
          
          const handleDrop = useCallback((e, roomId) => {
            e.preventDefault();
            const dwellerId = e.dataTransfer.getData('dwellerId');
            if (dwellerId) {
                mutateState(s => { 
                    const d = s.dwellers.find(x => x.id === dwellerId);
                    if (d) d.roomId = roomId; 
                });
            }
          }, [mutateState]);

          const handleEquipDrop = useCallback((e, dwellerId) => {
            e.preventDefault();
            const itemType = e.dataTransfer.getData('itemType');
            if (!itemType || itemType === 'none') return;
            mutateState(s => {
                const d = s.dwellers.find(x => x.id === dwellerId);
                if (!d || d.roomId === 'surface' || d.isCompanion) return;
                let resKey = itemType === 'weapon' ? 'weapons' : itemType === 'armor' ? 'armor' : itemType === 'stimpak' ? 'stimpaks' : null;
                if (s.resources[resKey] > 0) {
                    let oldKey = d.equipped === 'weapon' ? 'weapons' : d.equipped === 'armor' ? 'armor' : d.equipped === 'stimpak' ? 'stimpaks' : null;
                    s.resources[resKey] -= 1;
                    if (oldKey) s.resources[oldKey] += 1;
                    d.equipped = itemType;
                    addLog(s, `🎒 ${d.name} экипирован: ${itemType}.`);
                } else { addLog(s, `❌ Нет этого снаряжения.`); }
            });
          }, [mutateState]);

          const renameDweller = (id, newName) => {
            if (newName.trim().length > 0) { 
                mutateState(s => {
                    const d = s.dwellers.find(x => x.id === id);
                    if(d) d.name = newName.trim().substring(0, 12);
                });
            }
            setEditingDweller(null);
          };

          const handleMutate = (s) => {
            if (s.resources.science < 50 || s.resources.energy < 20) { addLog(s, '❌ Нужно 50🔬 и 20⚡'); return; }
            const medbay = s.rooms.find(r => r.type === 'medbay');
            if (!medbay) return;
            const target = s.dwellers.find(d => d.roomId === medbay.id && !d.isMutant && !d.isCyborg && !d.isCompanion && d.trait !== 'leader');
            if (!target) { addLog(s, '❌ В Медпункте нет подходящих людей.'); return; }
            
            s.resources.science -= 50;
            s.resources.energy -= 20;
            const mutTypes = ['mutant_worker', 'mutant_combat', 'mutant_psi'];
            const newTrait = mutTypes[Math.floor(Math.random() * mutTypes.length)];
            
            target.isMutant = true;
            target.trait = newTrait;
            target.morale = 100;
            target.isSick = false;
            addLog(s, `🧬 ${target.name} подвергся мутации! Теперь он ${TRAITS.find(t=>t.id===newTrait).name}.`);
          };

          const cyborgizeDweller = (s, dwellerId) => {
            if (s.resources.droneParts >= 1 && s.resources.energy >= 30) {
              s.resources.droneParts -= 1;
              s.resources.energy -= 30;
              const dw = s.dwellers.find(d => d.id === dwellerId);
              if (dw) {
                  dw.isSick = false; dw.isCyborg = true; dw.isMutant = false; dw.morale = 50;
                  addLog(s, `🦾 Установлен киберимплант. Плоть слаба, машина вечна!`);
              }
            } else { addLog(s, `❌ Нужна 1 Деталь Дрона и 30 Тп.`); }
          };

          const resolveQuest = (s, action) => {
            if (action === 'risk') {
               if (Math.random() > 0.5) {
                  addLog(s, `🏆 Риск оправдался! Найден тайник (+1 Оружие, +20 Тп, +1 Деталь).`);
                  s.resources.weapons += 1; s.resources.energy += 20; s.resources.droneParts += 1;
               } else {
                  addLog(s, `🚨 Ловушка! Дроны атакуют шлюз!`);
                  s.breach = { active: true, strength: 3, timer: 10, isRaiders: false };
               }
            } else { addLog(s, `💨 Мы отступили в тень.`); }
            setActiveQuest(null);
          };

          const resolveRaiders = (s, action) => {
             if (action === 'pay') {
                if (s.resources.water >= s.raiders.demand.water && s.resources.weapons >= s.raiders.demand.weapons) {
                   s.resources.water -= s.raiders.demand.water;
                   s.resources.weapons -= s.raiders.demand.weapons;
                   s.raiders = { active: false, demand: {water:0, weapons:0}, timer:0, strength:0 };
                   addLog(s, `🏴‍☠️ Дань уплачена. Рейдеры ушли.`);
                } else {
                   addLog(s, `❌ Не хватает ресурсов для дани!`);
                }
             } else {
                addLog(s, `⚔️ К БОЮ! Рейдеры штурмуют шлюз!`);
                s.breach = { active: true, timer: 5, strength: s.raiders.strength, isRaiders: true };
                s.raiders = { active: false, demand: {water:0, weapons:0}, timer:0, strength:0 };
             }
          };

          const trade = (s, type) => {
            if (!s.merchant.active) return;
            const discount = Math.floor(s.factions.hansa / 20) + (s.commander.perks.includes('hansa_discount') ? 5 : 0); 
            if (type === 'energy' && s.resources.mushrooms >= Math.max(1, s.merchant.rates.buyEnergy - discount)) {
              s.resources.mushrooms -= Math.max(1, s.merchant.rates.buyEnergy - discount);
              s.resources.energy += 10;
              addLog(s, `🤝 Куплено 10⚡.`);
            } else if (type === 'air' && s.resources.mushrooms >= Math.max(1, s.merchant.rates.buyAir - discount)) {
              s.resources.mushrooms -= Math.max(1, s.merchant.rates.buyAir - discount);
              s.resources.air += 10;
              addLog(s, `🤝 Куплено 10 Воздуха.`);
            } else if (type === 'weapons' && s.resources.vodka >= Math.max(1, s.merchant.rates.buyWeapon - discount)) {
              s.resources.vodka -= Math.max(1, s.merchant.rates.buyWeapon - discount);
              s.resources.weapons += 1;
              addLog(s, `🤝 Куплено Оружие.`);
            } else { addLog(s, `❌ Недостаточно ресурсов.`); }
          };

          const sendCaravan = (s, faction) => {
            if (s.vehicles.handcar <= 0 && s.vehicles.jeep <= 0 && s.vehicles.motorcycle <= 0) { addLog(s, `❌ Нужен транспорт.`); return; }
            if (s.expedition) { addLog(s, `❌ Транспорт занят в экспедиции.`); return; }
            if (faction === 'hansa' && s.resources.energy >= 50 && s.resources.water >= 50) {
               s.resources.energy -= 50; s.resources.water -= 50;
               s.factions.hansa += 10;
               addLog(s, `🤝 Дары доставлены Ганзе (+10 Репутации).`);
            } else if (faction === 'sparta' && s.resources.weapons >= 5) {
               s.resources.weapons -= 5;
               s.factions.sparta += 10;
               addLog(s, `🤝 Оружие доставлено Спарте (+10 Репутации).`);
            } else { addLog(s, `❌ Не хватает ресурсов.`); }
          };

          const handleSave = () => {
              localStorage.setItem('dome_save', JSON.stringify(gameState));
              mutateState(s => addLog(s, "💾 Игра успешно сохранена."));
          };

          const handleLoad = () => {
              const save = localStorage.getItem('dome_save');
              if (save) {
                  setGameState(JSON.parse(save));
              } else {
                  mutateState(s => addLog(s, "❌ Сохранение не найдено."));
              }
          };

          const handleNewGame = () => {
              if(confirm("Вы уверены? Весь прогресс будет потерян!")) setGameState(getInitialState());
          };

          const getActualCost = useCallback((roomsCount) => {
             const cost = getBuildCost(roomsCount);
             const hasLeader = gameState.dwellers.some(d => d.trait === 'leader' && !d.dead);
             if (hasLeader) { cost.energy = Math.floor(cost.energy * 0.9); cost.mushrooms = Math.floor(cost.mushrooms * 0.9); }
             return cost;
          }, [gameState.dwellers]);

          const handleDwellerClick = (e, id) => {
            e.stopPropagation();
            if (selectedEquip) {
                mutateState(s => {
                    const d = s.dwellers.find(x => x.id === id);
                    if (!d || d.roomId === 'surface' || d.isCompanion) return;
                    let resKey = selectedEquip === 'weapon' ? 'weapons' : selectedEquip === 'armor' ? 'armor' : selectedEquip === 'stimpak' ? 'stimpaks' : null;
                    if (s.resources[resKey] > 0) {
                        let oldKey = d.equipped === 'weapon' ? 'weapons' : d.equipped === 'armor' ? 'armor' : d.equipped === 'stimpak' ? 'stimpaks' : null;
                        s.resources[resKey] -= 1;
                        if (oldKey) s.resources[oldKey] += 1;
                        d.equipped = selectedEquip;
                        addLog(s, `🎒 ${d.name} экипирован: ${selectedEquip}.`);
                    } else { addLog(s, `❌ Нет этого снаряжения.`); }
                });
                setSelectedEquip(null);
            } else {
                setSelectedDwellerId(prev => prev === id ? null : id);
            }
          };

          const handleRoomClick = (roomId) => {
            if (selectedDwellerId) {
                mutateState(s => { s.dwellers.forEach(d => { if (d.id === selectedDwellerId) d.roomId = roomId; }); });
                setSelectedDwellerId(null);
            }
          };

          const handleEquipClick = (type) => {
            if (gameState.resources[type === 'weapon' ? 'weapons' : type === 'armor' ? 'armor' : 'stimpaks'] <= 0) return;
            setSelectedEquip(prev => prev === type ? null : type);
            setSelectedDwellerId(null);
          };

          const hasRoom = useCallback((type) => gameState.rooms.some(r => r.type === type), [gameState.rooms]);

          const currentBuildCost = getActualCost(gameState.rooms.length);
          let maxCaps = { water: 100, energy: 100, air: 100, mushrooms: 100, vodka: 20, weapons: 10, armor: 10, stimpaks: 10, emp: 5, traps: 5, science: 100, droneParts: 5 };
          gameState.rooms.forEach(r => {
            if (r.type === 'warehouse' && r.status === 'normal') {
              maxCaps.water += r.level * 50; maxCaps.energy += r.level * 50; maxCaps.air += r.level * 50; maxCaps.mushrooms += r.level * 50; maxCaps.droneParts += r.level * 5;
            }
            if (r.type === 'project') { maxCaps.energy += 1000; maxCaps.science += 500; maxCaps.droneParts += 20; }
          });

          return (
            <>
            <div className={`min-h-screen bg-neutral-950 text-stone-300 p-2 sm:p-4 font-mono selection:bg-orange-500 text-xs sm:text-sm flex flex-col relative transition-all duration-300 ${gameState.breach.active || gameState.boss.active ? 'animate-shake shadow-[inset_0_0_150px_rgba(220,38,38,0.3)] bg-red-950' : ''} ${gameState.isBlackout ? 'blackout-overlay brightness-50' : ''} ${gameState.season.type === 'winter' ? 'winter-overlay' : gameState.season.type === 'acid' ? 'acid-overlay' : ''}`}>
              
              {/* Dev Panel */}
              {showDev && (
                  <div className="fixed top-16 left-4 bg-purple-900/90 border-2 border-purple-500 p-4 rounded z-[200] shadow-2xl flex flex-col gap-2">
                     <h3 className="font-bold text-white mb-2">DEV PANEL</h3>
                     <button onClick={() => mutateState(s => s.tickSpeed = s.tickSpeed === 2000 ? 200 : 2000)} className="bg-stone-800 p-1 rounded text-white text-xs">Скорость: {gameState.tickSpeed}ms</button>
                     <button onClick={() => mutateState(s => { Object.keys(s.resources).forEach(k => s.resources[k] += 1000); addLog(s, "DEV: +1000 Resources"); })} className="bg-stone-800 p-1 rounded text-white text-xs">+1000 Ресурсов</button>
                     <button onClick={() => mutateState(s => { Object.keys(s.unlockedTech).forEach(k => s.unlockedTech[k] = true); addLog(s, "DEV: All Tech"); })} className="bg-stone-800 p-1 rounded text-white text-xs">Открыть все Технологии</button>
                     <button onClick={() => mutateState(s => { s.raiders = { active: true, demand: { water: 10, weapons: 1 }, timer: 10, strength: 10 }; addLog(s, "DEV: Spawn Raiders"); })} className="bg-stone-800 p-1 rounded text-white text-xs">Спавн Рейдеров</button>
                     <button onClick={() => mutateState(s => { s.storm = { active: true, nextIn: 0, duration: 20 }; addLog(s, "DEV: Spawn Storm"); })} className="bg-stone-800 p-1 rounded text-white text-xs">Спавн Бури</button>
                     <button onClick={() => setShowDev(false)} className="bg-red-800 p-1 rounded text-white text-xs mt-2">Закрыть</button>
                  </div>
              )}

              {/* Модальное Окно Обучения / Советник */}
              {showTutorial && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-black/90 p-2 sm:p-4 pt-8 sm:pt-12 overflow-y-auto">
                  <div className="bg-stone-900 border-2 border-orange-600 rounded w-full max-w-3xl flex flex-col shadow-[0_0_50px_rgba(234,88,12,0.2)] overflow-hidden my-auto">
                    
                    <div className="p-4 sm:p-6 shrink-0 border-b border-orange-800 flex justify-between items-center bg-stone-950 sticky top-0 z-50">
                       <h2 className="text-xl sm:text-2xl font-black text-orange-500 uppercase tracking-widest">Руководство по Выживанию</h2>
                       <button onClick={() => setShowTutorial(false)} className="text-stone-500 hover:text-white"><X className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-5 text-xs sm:text-sm text-stone-300">
                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">👑 Командир и Мораль</h3>
                        <p>У тебя есть <b>Командир</b> (шляпа 👑). Он дает скидку 10% на постройки. Если он умрет во время боя — игра окончена! Во вкладке Законы/Лидер качай ему перки за опыт! Мораль остальных падает от работы. Для восстановления отправляй их в Жилой Блок или Бар. Если мораль упадет до 0, начнется <b>Бунт (🤬)</b>.</p>
                      </section>

                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">🎒 Экипировка и Перемещение (TAP/КЛИК)</h3>
                        <p>На телефонах и ПК <b>кликни на нужную экипировку</b> (🔫, 🛡️, 💉) в шапке ресурсов, чтобы выделить её, а затем <b>кликни по жителю во вкладке "Персонал"</b>, чтобы выдать её ему! Точно так же можно переводить жителей: кликни по жителю (появится белая рамка), а затем кликни по комнате.</p>
                      </section>

                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">🧬 Лаборатория Мутаций</h3>
                        <p>Помести здорового жителя в <b>Медпункт</b>, и на главной панели (справа от Купола) появится кнопка <b>МУТАЦИЯ</b>. За 50 Науки и 20 Топлива ты сделаешь из него полезного сверхчеловека (Псионик, Ударник или Громила).</p>
                      </section>

                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">❄️ Сезоны и Катастрофы</h3>
                        <p>Погода меняется. <b>Ядерная Зима</b> удваивает расход Топлива и режет урожай ферм. <b>Кислотный Дождь</b> делает вылазки смертельно опасными. Туши пожары (🔥) водой. Если в отсеке завелись муто-крысы (🐛), <b>перетащи туда жителя с Оружием (🔫)</b>, и он сам всё зачистит, не тратя патроны!</p>
                      </section>

                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">🗺️ Гараж, Транспорт и Питомцы</h3>
                        <p>В Гараже можно сделать <b>Мотоцикл, Дрезину, Джип или Шагоход</b> (выбирай в меню экспедиций). На руинах можно найти щенка (🐕) для бонуса морали, а в Гараже собрать дрона-ремонтника (🤖), который сам чинит отсеки.</p>
                      </section>

                      <section>
                        <h3 className="text-orange-400 font-bold mb-1">⚔️ Оборона и Рейдеры</h3>
                        <p>Сбивай летящие НЛО кликом. Если шлюз атакуют Дроны или <b>Рейдеры</b> (потребуют дань), безоружные погибнут! Стройте <b>Караулку</b> (охранники защитят рабочих) и Ловушки (🪤) в шлюзе. Внимание: вы можете построить <b>только 1 отсек каждого типа!</b></p>
                      </section>

                      <section>
                        <h3 className="text-fuchsia-400 font-bold mb-1">🚀 Эндгейм: ПРОЕКТ ИСХОД</h3>
                        <p>Изучите финальный проект. Постройте его за 800⚡, 200🔬, 15⚙️. Уничтожьте Материнский Корабль дронов, чтобы победить!</p>
                      </section>
                    </div>
                    
                    <div className="p-4 sm:p-6 shrink-0 border-t border-orange-800 bg-stone-950 sticky bottom-0 z-50">
                      <button onClick={() => setShowTutorial(false)} className="w-full py-3 bg-orange-900/80 hover:bg-orange-800 text-orange-400 font-bold uppercase tracking-widest rounded border border-orange-500 transition-transform hover:scale-[1.02] shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                        К ВЫЖИВАНИЮ ГОТОВ!
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gameState.endgame.won && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 p-4">
                  <div className="bg-stone-100 border-4 border-cyan-500 p-10 rounded-xl max-w-3xl w-full text-center shadow-[0_0_100px_rgba(6,182,212,0.8)]">
                    <Sparkles className="w-24 h-24 text-cyan-500 mx-auto mb-6 animate-pulse" />
                    <h1 className="text-5xl font-black text-cyan-600 uppercase tracking-widest mb-4">ПОБЕДА!</h1>
                    <p className="text-xl text-stone-800 font-sans mb-8">ЭМИ-Излучатель сработал. Материнский корабль пал, а купол над городом разрушен. Мы наконец-то видим солнце. Командир, вы спасли свое Убежище!</p>
                    <button onClick={handleNewGame} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-lg shadow-lg transition-transform hover:scale-105">Начать Новую Игру</button>
                  </div>
                </div>
              )}

              {activeQuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                  <div className="bg-stone-900 border-2 border-amber-600 p-6 rounded max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center relative">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-pulse" />
                    <h2 className="text-lg font-black text-amber-500 uppercase tracking-widest mb-4 border-b border-stone-700 pb-2">Событие на Базе</h2>
                    <div className="bg-stone-800/50 p-4 rounded border border-stone-700/50 text-stone-300 text-sm leading-relaxed shadow-inner mb-6">«{activeQuest.text}»</div>
                    <div className="flex gap-3">
                      <button onClick={() => mutateState(s => resolveQuest(s, 'risk'))} className="flex-1 py-3 bg-amber-900/40 hover:bg-amber-800 text-amber-400 font-bold uppercase rounded border border-amber-700 transition-colors">Рискнуть</button>
                      <button onClick={() => mutateState(s => resolveQuest(s, 'leave'))} className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold uppercase rounded border border-stone-600 transition-colors">Уйти</button>
                    </div>
                  </div>
                </div>
              )}

              {gameState.raiders.active && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                  <div className="bg-stone-900 border-2 border-red-600 p-6 rounded max-w-lg w-full shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center relative">
                    <Skull className="w-12 h-12 text-red-500 mx-auto mb-3 animate-pulse" />
                    <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-4 border-b border-stone-700 pb-2">НАПАДЕНИЕ РЕЙДЕРОВ</h2>
                    <div className="bg-stone-800/50 p-4 rounded border border-stone-700/50 text-stone-300 text-sm leading-relaxed shadow-inner mb-6">
                      «Открывайте шлюз и отдавайте ресурсы, иначе мы перебьем вас всех!»<br/><br/>
                      Требуют: <span className="text-cyan-400 font-bold">{gameState.raiders.demand.water} Воды</span> и <span className="text-stone-300 font-bold">{gameState.raiders.demand.weapons} Оружия</span>.
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => mutateState(s => resolveRaiders(s, 'pay'))} className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold uppercase rounded border border-stone-600 transition-colors">Откупиться</button>
                      <button onClick={() => mutateState(s => resolveRaiders(s, 'fight'))} className="flex-1 py-3 bg-red-900/40 hover:bg-red-800 text-red-400 font-bold uppercase rounded border border-red-700 transition-colors">К Бою!</button>
                    </div>
                  </div>
                </div>
              )}

              {activeReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                  <div className="bg-stone-900 border-2 border-stone-600 p-6 rounded max-w-lg w-full shadow-[0_0_50px_rgba(255,255,255,0.1)] relative">
                    <h2 className="text-xl font-black text-stone-300 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-stone-700 pb-2"><Sparkles className="w-5 h-5 text-cyan-500" /> Отчет с Поверхности</h2>
                    <div className="flex items-center gap-4 mb-4 bg-stone-950 p-3 rounded border border-stone-800">
                      <div>
                        <p className="text-sm font-bold text-stone-200">Отряд лидера: {activeReport.name}</p>
                        <p className="text-[10px] text-stone-500 mt-1 flex flex-wrap gap-1">Собрано: <span className="text-cyan-500">{activeReport.loot.water} Пр</span> | <span className="text-yellow-500">{activeReport.loot.energy} Тп</span> | <span className="text-stone-400">{activeReport.loot.air} Вз</span> | <span className="text-indigo-400">{activeReport.loot.science||0} 🔬</span> | <span className="text-stone-300">{activeReport.loot.weapons||0} 🔫</span> | <span className="text-slate-400">{activeReport.loot.droneParts||0} ⚙️</span></p>
                        {activeReport.isSick && <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">ОБЛУЧЕНИЕ КУПОЛА / РАНЕНИЕ В ОТРЯДЕ</p>}
                        {activeReport.weaponSaved && <p className="text-xs text-blue-400 font-bold mt-1">ЧАСТЬ ЭКИПИРОВКИ УНИЧТОЖЕНА В БОЮ</p>}
                      </div>
                    </div>
                    <div className="bg-stone-800/50 p-4 rounded border border-stone-700/50 text-stone-300 italic text-sm leading-relaxed shadow-inner">«{activeReport.text}»</div>
                    <button onClick={() => setActiveReport(null)} className="mt-6 w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold uppercase tracking-widest rounded border border-stone-600 transition-colors">Принять груз</button>
                  </div>
                </div>
              )}

              <header className="flex flex-wrap gap-2 items-center justify-between bg-stone-900 border-b border-stone-600 p-2 sm:p-4 rounded-t mb-4 shadow-xl relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
                <div className="flex flex-col z-10">
                  <h1 className="text-lg sm:text-xl font-black tracking-widest flex items-center gap-2 uppercase">
                    <ShieldAlert className={`w-5 h-5 sm:w-6 sm:h-6 ${gameState.isBlackout ? 'text-stone-600' : 'text-orange-500'}`} /> 
                    <span className={gameState.season.type === 'winter' ? 'text-blue-300' : gameState.season.type === 'acid' ? 'text-lime-400' : 'text-stone-300'}>Убежище</span>
                    <button onClick={() => setShowDev(!showDev)} className="text-stone-600 hover:text-stone-300 transition-colors"><Settings className="w-4 h-4"/></button>
                    <button onClick={() => setShowTutorial(true)} className="ml-2 text-stone-500 hover:text-stone-300 transition-colors" title="Показать обучение"><HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                  </h1>
                  <span className="text-[10px] font-bold mt-0.5 text-stone-500 flex items-center gap-1">
                    Погода: {gameState.season.type === 'winter' ? <span className="text-blue-300">Ядерная Зима ❄️</span> : gameState.season.type === 'acid' ? <span className="text-lime-400">Кислотный Дождь 🌧️</span> : 'Норма'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-4 z-10 bg-stone-950/50 p-2 rounded border border-stone-800 text-[10px] sm:text-xs">
                  <ResourceIndicator icon={<Droplet />} value={gameState.resources.water} max={maxCaps.water} color="text-cyan-500" label="Вода" />
                  <ResourceIndicator icon={gameState.isBlackout ? <ZapOff className="animate-pulse" /> : <Zap />} value={gameState.resources.energy} max={maxCaps.energy} color={gameState.isBlackout ? "text-red-500" : "text-yellow-500"} label="Топливо" />
                  <ResourceIndicator icon={<Wind />} value={gameState.resources.air} max={maxCaps.air} color="text-stone-400" label="Воздух" />
                  <div className="w-px bg-stone-700 mx-1"></div>
                  <ResourceIndicator icon={<Sprout />} value={gameState.resources.mushrooms} max={maxCaps.mushrooms} color="text-amber-500" label="Грибы" />
                  <ResourceIndicator icon={<Martini />} value={gameState.resources.vodka} max={maxCaps.vodka} color="text-purple-400" label="Водка" />
                  <div className="w-px bg-stone-700 mx-1"></div>
                  
                  <div draggable={gameState.resources.weapons > 0} onDragStart={(e) => e.dataTransfer.setData('itemType', 'weapon')} onClick={() => handleEquipClick('weapon')} className={`${gameState.resources.weapons > 0 ? 'cursor-pointer' : 'opacity-50'} ${selectedEquip === 'weapon' ? 'ring-2 ring-white rounded bg-white/20' : ''}`}><ResourceIndicator icon={<Swords />} value={gameState.resources.weapons} max={maxCaps.weapons} color="text-stone-200" label="Оружие" isInt /></div>
                  <div draggable={gameState.resources.armor > 0} onDragStart={(e) => e.dataTransfer.setData('itemType', 'armor')} onClick={() => handleEquipClick('armor')} className={`${gameState.resources.armor > 0 ? 'cursor-pointer' : 'opacity-50'} ${selectedEquip === 'armor' ? 'ring-2 ring-white rounded bg-white/20' : ''}`}><ResourceIndicator icon={<ShieldHalf />} value={gameState.resources.armor} max={maxCaps.armor} color="text-stone-400" label="Броня" isInt /></div>
                  <div draggable={gameState.resources.stimpaks > 0} onDragStart={(e) => e.dataTransfer.setData('itemType', 'stimpak')} onClick={() => handleEquipClick('stimpak')} className={`${gameState.resources.stimpaks > 0 ? 'cursor-pointer' : 'opacity-50'} ${selectedEquip === 'stimpak' ? 'ring-2 ring-white rounded bg-white/20' : ''}`}><ResourceIndicator icon={<Syringe />} value={gameState.resources.stimpaks} max={maxCaps.stimpaks} color="text-green-400" label="Стимпак" isInt /></div>
                  
                  <div className="w-px bg-stone-700 mx-1"></div>
                  <ResourceIndicator icon={<Bomb />} value={gameState.resources.emp} max={maxCaps.emp} color="text-red-400" label="ЭМИ" isInt />
                  <ResourceIndicator icon={<span className="text-[10px]">🪤</span>} value={gameState.resources.traps} max={maxCaps.traps} color="text-stone-400" label="Ловушки" isInt />
                  <ResourceIndicator icon={<FlaskConical />} value={gameState.resources.science} max={maxCaps.science} color="text-indigo-400" label="Наука" />
                  <ResourceIndicator icon={<Cpu />} value={gameState.resources.droneParts} max={maxCaps.droneParts} color="text-slate-400" label="Детали" />
                </div>
              </header>

              {/* Основной Интерфейс */}
              {gameState.gameOver.active ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 bg-red-950/80 rounded border border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.2)] z-10 relative">
                  <Skull className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
                  <h2 className="text-3xl font-black text-red-500 mb-2 tracking-widest text-center uppercase">Убежище Зачищено</h2>
                  <p className="text-stone-400 font-sans text-center max-w-md">{gameState.gameOver.reason}</p>
                  <button onClick={handleNewGame} className="mt-8 px-6 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-200 font-black uppercase tracking-widest transition-colors">Начать заново</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 relative z-10 pb-8">
                  
                  {/* База и Экспедиции */}
                  <div className="xl:col-span-3 flex flex-col gap-2">
                    
                    {/* Панель Управления Игрой (Save/Load) */}
                    <div className="bg-stone-900 border border-stone-700 p-2 rounded flex gap-2 justify-end">
                       <button onClick={handleSave} className="flex items-center gap-1 text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 border border-stone-600"><Save className="w-3 h-3"/> Сохранить</button>
                       <button onClick={handleLoad} className="flex items-center gap-1 text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 border border-stone-600"><Download className="w-3 h-3"/> Загрузить</button>
                       <button onClick={handleNewGame} className="flex items-center gap-1 text-[10px] bg-red-900/40 hover:bg-red-800 px-2 py-1 rounded text-red-400 border border-red-800"><RotateCcw className="w-3 h-3"/> Сброс</button>
                    </div>

                    <div className="bg-[#1c1917] p-2 sm:p-4 rounded border-2 border-stone-800 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-4 relative h-full">
                      
                      {/* Шлюз и Купол */}
                      <div 
                        className={`relative h-12 sm:h-16 border-b-4 border-stone-900 bg-stone-900 rounded-t overflow-hidden flex flex-col justify-end shrink-0 ${selectedDwellerId ? 'cursor-pointer hover:ring-2 hover:ring-white' : ''}`}
                        onClick={() => handleRoomClick('surface')}
                        onMouseEnter={() => setHoveredRoomId('surface')}
                        onMouseLeave={() => setHoveredRoomId(null)}
                      >
                        <div className={`absolute inset-0 pointer-events-none transition-colors ${gameState.season.type === 'acid' ? 'bg-gradient-to-t from-lime-950/40 to-stone-900' : 'bg-gradient-to-t from-green-950/20 to-stone-900'}`}></div>
                        
                        <div className="absolute top-1 left-2 flex items-center gap-2 z-10 pointer-events-none">
                          <span className="text-green-700/40 font-black uppercase text-[10px] tracking-widest">КУПОЛ СЕКТОР-4</span>
                          {gameState.safeSurface && <span className="text-cyan-400 font-bold uppercase text-[8px] animate-pulse border border-cyan-800 bg-cyan-950/50 px-1 rounded">РАДАР ЧИСТ</span>}
                        </div>

                        {/* Кнопки Шлюза */}
                        <div className="absolute top-1 right-1 flex items-center gap-1 z-30">
                          {gameState.tutorialStep < 4 && <span className="text-[8px] text-orange-400 bg-orange-900/50 px-1 rounded mr-2 animate-pulse hidden md:block">{['Назначь рабочих в Дизель', 'Построй Очистную и Грибницу', 'Отправь Экспедицию в Руины', 'Изучи и построй Оружейную'][gameState.tutorialStep]}</span>}
                          
                          {gameState.dwellers.some(d => d.roomId === gameState.rooms.find(r=>r.type==='medbay')?.id && !d.isMutant && !d.isCyborg && !d.isCompanion && d.trait !== 'leader') && (
                            <button onClick={(e) => { e.stopPropagation(); mutateState(s => handleMutate(s)); }} className="bg-lime-900/80 hover:bg-lime-800 border border-lime-500 text-lime-400 text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg transition-transform hover:scale-105 pointer-events-auto">
                                🧬 МУТАЦИЯ (50🔬 20⚡)
                            </button>
                          )}
                          
                          {gameState.breach.active ? (
                            <span className="bg-red-950 border border-red-500 text-red-500 text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse pointer-events-auto">
                               <Shield className="w-2 h-2" /> ПРОРЫВ ({gameState.breach.timer}с)
                            </span>
                          ) : gameState.queue.length > 0 ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); mutateState(s => { const d = s.queue.shift(); s.dwellers.push({...d, roomId: s.rooms.find(r=>r.type==='living')?.id || s.rooms[0].id}); addLog(s, `🚪 Впустили ${d.name}`); }); }} className="bg-green-900/80 hover:bg-green-800 border border-green-500 text-green-400 text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg transition-transform hover:scale-105 pointer-events-auto">
                                 <DoorClosed className="w-2 h-2" /> ВПУСТИТЬ ({gameState.queue.length})
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); mutateState(s => { s.queue.shift(); addLog(s, `❌ Прогнали беженца.`); }); }} className="bg-red-900/80 hover:bg-red-800 border border-red-500 text-red-400 p-0.5 rounded shadow-lg transition-transform hover:scale-105 pointer-events-auto">
                                 <X className="w-2.5 h-2.5" />
                              </button>
                            </>
                          ) : (
                            <span className="bg-stone-800 border border-stone-900 text-stone-500 text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                               <DoorClosed className="w-2 h-2" /> ШЛЮЗ
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute inset-0 flex pointer-events-none">
                          <div className="flex-1 relative border-r border-stone-800">
                            <div className="absolute bottom-1 left-2 opacity-30 text-[10px] sm:text-xs">🏚️ 🛢️</div>
                            {gameState.expedition && <ExpeditionView expedition={gameState.expedition} dwellers={gameState.dwellers} isPaused={hoveredRoomId === 'surface'} />}
                          </div>
                          <div className="flex-1 relative pointer-events-auto">
                            <div className="absolute inset-0 pb-1">
                              {gameState.queue.map(q => <Dweller key={q.id} dweller={q} isOutside={true} colorClass={getTheme('none').dweller} isPaused={hoveredRoomId === 'surface'} />)}
                            </div>
                          </div>
                        </div>

                        {gameState.ufo.active && !gameState.boss.active && (
                          <div onClick={(e) => { e.stopPropagation(); mutateState(s => { if (s.resources.emp > 0) { s.resources.emp--; s.ufo.hp -= 100; addLog(s, `💣 ЭМИ!`); } else { s.ufo.hp--; } if (s.ufo.hp <= 0) { s.ufo.active = false; s.resources.weapons++; s.resources.energy+=10; s.resources.droneParts++; addLog(s, `💥 Дрон сбит!`); } }); }} className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl sm:text-5xl cursor-crosshair hover:scale-110 active:scale-95 transition-transform z-30 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] select-none">
                            🛸
                            {gameState.resources.emp > 0 && <div className="absolute -right-4 -top-2 text-[10px] bg-red-600 text-white rounded px-1 animate-pulse">ЭМИ!</div>}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 flex gap-1 mt-1">
                              {Array.from({length: Math.min(10, gameState.ufo.hp)}).map((_,i) => <div key={i} className="w-1.5 h-1.5 bg-red-500 rounded-full" />)}
                            </div>
                          </div>
                        )}
                        
                        {gameState.boss.active && (
                          <div onClick={(e) => { e.stopPropagation(); mutateState(s => { let dmg = 10; if(s.resources.emp>0){ s.resources.emp--; dmg=200; addLog(s, `💣 ЭМИ!`); } s.boss.hp -= dmg; if(s.boss.hp <= 0){ s.boss.active=false; s.endgame.won=true; } }); }} className="absolute top-2 left-1/2 -translate-x-1/2 cursor-crosshair active:scale-95 transition-transform z-30 flex flex-col items-center">
                            <div className="text-6xl sm:text-8xl drop-shadow-[0_0_30px_rgba(255,0,0,1)] animate-float">🛸</div>
                            <div className="w-48 h-2 bg-stone-900 border border-stone-700 mt-2 rounded-full overflow-hidden">
                               <div className="h-full bg-red-600 transition-all" style={{width: `${(gameState.boss.hp/2000)*100}%`}}></div>
                            </div>
                            <span className="text-[8px] font-bold text-red-500 mt-1 uppercase">Материнский Корабль ({Math.floor(gameState.boss.hp)} XP)</span>
                            {gameState.resources.emp > 0 && <div className="absolute -right-8 top-0 text-[10px] bg-red-600 text-white rounded px-1 animate-pulse">ЭМИ!</div>}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
                        {/* Панель Экспедиций */}
                        <div className="bg-stone-900 border border-stone-800 rounded p-2 flex flex-col gap-2 shadow-inner">
                          <h2 className="text-[10px] font-bold text-stone-400 uppercase flex items-center justify-between border-b border-stone-800 pb-1">
                            <span className="flex items-center gap-1"><Map className="w-3 h-3 text-orange-600"/> Экспедиции</span>
                            {gameState.storm.active ? <span className="text-[8px] text-red-500 animate-pulse">БУРЯ ({gameState.storm.duration}ч)</span> : <span className="text-[8px] text-stone-600">Буря через: {gameState.storm.nextIn}ч</span>}
                          </h2>

                          {gameState.expedition || isGeneratingReport ? (
                            <div className="bg-stone-950 p-1.5 rounded border border-stone-800 flex justify-between items-center text-[9px] flex-1">
                              <span className="text-orange-500 font-bold">{isGeneratingReport ? 'Связь...' : `Отряд в пути: ${LOCATIONS[gameState.expedition.location]?.name || ''}`}</span>
                              {!isGeneratingReport && <span className="text-stone-400">{gameState.expedition.time}ч</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 flex-1 justify-between">
                              <div className="flex gap-2">
                                <div className="flex-1 bg-stone-950 border border-stone-700 rounded p-1.5 flex flex-wrap gap-1 items-center min-h-[30px]">
                                  <span className="text-[8px] text-stone-500 w-full mb-0.5">Выберите отряд:</span>
                                  {gameState.dwellers.filter(d => !d.isSick && d.roomId !== 'surface' && !d.isCompanion).map(d => (
                                    <button 
                                      key={d.id} onClick={() => mutateState(s => {
                                         const max = s.selectedVehicle === 'motorcycle' ? 1 : s.selectedVehicle === 'mech' ? 2 : s.selectedVehicle === 'jeep' ? 4 : 3;
                                         if (s.squadSelection.includes(d.id)) s.squadSelection = s.squadSelection.filter(x => x !== d.id);
                                         else if (s.squadSelection.length < max) s.squadSelection.push(d.id);
                                      })}
                                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${gameState.squadSelection.includes(d.id) ? 'bg-orange-900/50 border-orange-500 text-orange-300' : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'}`}
                                    >
                                      {gameState.squadSelection.includes(d.id) && <CheckSquare className="w-2 h-2 inline mr-0.5"/>} {d.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 items-center">
                                <select id="expedition-loc" disabled={gameState.storm.active || gameState.breach.active || gameState.squadSelection.length === 0} className="flex-1 bg-stone-950 border border-stone-700 text-stone-400 text-[9px] rounded px-1 py-1.5 focus:outline-none uppercase disabled:opacity-50">
                                  {Object.entries(LOCATIONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                                </select>
                                
                                <select value={gameState.selectedVehicle} onChange={e => mutateState(s => { s.selectedVehicle = e.target.value; const max = e.target.value === 'motorcycle' ? 1 : e.target.value === 'mech' ? 2 : e.target.value === 'jeep' ? 4 : 3; if (s.squadSelection.length > max) s.squadSelection = s.squadSelection.slice(0, max); })} disabled={gameState.storm.active || gameState.breach.active || gameState.squadSelection.length === 0} className="bg-stone-950 border border-stone-700 text-stone-400 text-[9px] rounded px-1 py-1.5 focus:outline-none uppercase disabled:opacity-50">
                                   <option value="none">Пешком</option>
                                   {gameState.vehicles.motorcycle > 0 && <option value="motorcycle">Мотоцикл (1 чел)</option>}
                                   {gameState.vehicles.handcar > 0 && <option value="handcar">Дрезина (3 чел)</option>}
                                   {gameState.vehicles.jeep > 0 && <option value="jeep">Джип (4 чел)</option>}
                                   {gameState.vehicles.mech > 0 && <option value="mech">Шагоход (2 чел)</option>}
                                </select>

                                <button disabled={gameState.storm.active || gameState.breach.active || gameState.squadSelection.length === 0} onClick={() => { const lId = document.getElementById('expedition-loc').value; if(lId) mutateState(s => {
                                    if (s.selectedVehicle !== 'none') { if (s.resources.energy < 20) { addLog(s, `❌ Нужно 20⚡ для транспорта.`); return; } s.resources.energy -= 20; s.vehicles[s.selectedVehicle]--; }
                                    s.dwellers.forEach(dw => { if (s.squadSelection.includes(dw.id)) dw.roomId = 'surface'; });
                                    const isSafe = s.safeSurface; if (isSafe) s.safeSurface = false;
                                    const expTime = s.selectedVehicle === 'motorcycle' ? 5 : s.selectedVehicle !== 'none' ? 7 : 15;
                                    s.expedition = { squad: s.squadSelection, location: lId, time: expTime, loot: { water: 0, energy: 0, air: 0, mushrooms: 0, vodka: 0, weapons: 0, science: 0, droneParts: 0 }, isSafe, vehicle: s.selectedVehicle, isSickEvent: false, weaponSavedEvent: false };
                                    addLog(s, `🗺️ Отряд вышел к: ${LOCATIONS[lId].name}.`);
                                    s.squadSelection = []; s.selectedVehicle = 'none';
                                }); }} className={`px-4 font-bold text-[9px] rounded uppercase border transition-colors h-full py-1.5 ${gameState.storm.active || gameState.breach.active || gameState.squadSelection.length === 0 ? 'bg-red-950/30 text-red-900 border-red-900 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-600'}`}>Идти</button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Лог Терминала */}
                        <div className="bg-stone-950 border border-stone-800 rounded p-2 flex flex-col shadow-inner min-h-[160px] max-h-[180px]">
                          <h2 className="text-[9px] font-bold text-stone-500 uppercase mb-1 flex items-center justify-between border-b border-stone-800 pb-1 shrink-0">
                            <span>_Лог_Событий_</span>
                            <div className="flex gap-2">
                              {gameState.rooms.some(r => r.type === 'radio' && r.status === 'normal' && !gameState.isBlackout) && <span className="flex items-center gap-1 text-[8px] text-teal-500 animate-pulse"><Radio className="w-2.5 h-2.5" /> Эфир...</span>}
                            </div>
                          </h2>
                          <div className="flex-1 overflow-y-auto text-[9px] font-mono scrollbar-hide space-y-1 mt-1">
                            {gameState.logs.map((log, i) => (
                              <div key={i} className={`${log.includes('⚠️') || log.includes('❌') || log.includes('🦠') || log.includes('💀') || log.includes('🛸') || log.includes('🚨') || log.includes('БЛЭКАУТ') || log.includes('🔥') || log.includes('☄️') || log.includes('УЖАС') || log.includes('🤬') || log.includes('🏴‍☠️') || log.includes('❄️') || log.includes('🌧️') || log.includes('🐛') ? 'text-red-400/90' : log.includes('🔊') ? 'text-cyan-500 font-bold' : log.includes('🏆') || log.includes('⭐') || log.includes('🦾') || log.includes('🎒') || log.includes('🛡️') || log.includes('🔫') || log.includes('🚜') || log.includes('🚀') || log.includes('🪤') || log.includes('🐕') || log.includes('🤖') || log.includes('🏍️') || log.includes('🚙') || log.includes('💡') || log.includes('🧬') ? 'text-amber-400 font-bold' : 'text-green-600/80'}`}>
                                {`>`} {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 shrink-0 pb-4">
                        {gameState.rooms.map((room) => {
                          const theme = getTheme(room.type);
                          const Icon = theme.icon;
                          const isBroken = room.status === 'broken' || room.status === 'fire' || room.status === 'rats' || room.status === 'riot' || (gameState.isBlackout && room.type !== 'generator');
                          
                          return (
                          <div 
                            key={room.id} 
                            className={`group relative h-24 border rounded shadow-inner overflow-hidden flex flex-col justify-between transition-colors ${isBroken ? 'bg-red-950/40 border-red-900' : `${theme.bg} ${theme.border}`} ${selectedDwellerId ? 'cursor-pointer hover:ring-2 hover:ring-white' : ''}`} 
                            onDragOver={handleDragOver} 
                            onDrop={(e) => handleDrop(e, room.id)}
                            onClick={() => handleRoomClick(room.id)}
                            onMouseEnter={() => setHoveredRoomId(room.id)}
                            onMouseLeave={() => setHoveredRoomId(null)}
                          >
                            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
                               <Icon className={`absolute top-1 right-1 w-10 h-10 ${theme.color} opacity-30`} />
                            </div>
                            
                            <div className={`absolute inset-0 pointer-events-none z-0 opacity-60 ${gameState.isBlackout && room.type !== 'generator' ? 'brightness-50' : ''}`}>
                               {room.type === 'living' && (<div className="absolute bottom-1 left-2 flex gap-1 items-end"><div className="w-6 h-2 bg-stone-700/80 rounded-sm"></div><div className="w-6 h-2 bg-stone-700/80 rounded-sm"></div></div>)}
                               {room.type === 'generator' && (<div className="absolute bottom-1 right-2 flex flex-col items-center"><div className="w-6 h-4 bg-stone-700 rounded-t-sm border border-stone-800 flex justify-center"><div className="w-4 h-1 bg-yellow-500/50 mt-1 animate-pulse"></div></div><div className="w-8 h-3 bg-stone-800 border-t border-stone-600"></div></div>)}
                               {room.type === 'filter' && (<div className="absolute top-1 right-2 w-6 h-6 border-2 border-stone-500/30 rounded-full flex items-center justify-center"><Wind className={`w-4 h-4 text-stone-400 ${!isBroken ? 'animate-[spin_3s_linear_infinite]' : ''}`}/></div>)}
                               {room.type === 'reservoir' && (<div className="absolute bottom-1 left-2 flex gap-1 items-end"><div className="w-3 h-5 bg-cyan-900/50 rounded-t-full border border-cyan-800 relative"><div className="absolute bottom-0 w-full h-2 bg-cyan-500/30"></div></div><div className="w-3 h-4 bg-cyan-900/50 rounded-t-full border border-cyan-800 relative"><div className="absolute bottom-0 w-full h-2 bg-cyan-500/30"></div></div></div>)}
                               {room.type === 'farm' && (<div className="absolute bottom-1 left-2 flex gap-2 items-end"><div className="w-2 h-3 bg-amber-500 rounded-t-full shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div><div className="w-3 h-4 bg-amber-400 rounded-t-full shadow-[0_0_5px_rgba(251,191,36,0.5)]"></div><div className="w-2 h-2 bg-amber-600 rounded-t-full"></div></div>)}
                               {room.type === 'medbay' && (<><div className="absolute bottom-1 right-2 w-8 h-3 bg-stone-200/20 border border-stone-300/30 rounded-sm flex items-center justify-center"><Heart className="w-2 h-2 text-red-500/50"/></div><RobotMedic isPaused={hoveredRoomId === room.id || isBroken} /></>)}
                               {room.type === 'bar' && (<div className="absolute bottom-1 right-2 flex flex-col items-end"><div className="flex gap-1 mb-px"><div className="w-1 h-3 bg-purple-400 rounded-t-sm"></div><div className="w-1 h-2 bg-green-500 rounded-t-sm"></div></div><div className="w-8 h-2 bg-stone-700 rounded-sm"></div></div>)}
                               {room.type === 'armory' && (<div className="absolute top-1 left-1 w-6 h-6 border border-stone-600 bg-stone-800/30 flex items-center justify-center rounded"><Swords className="w-4 h-4 text-stone-400/50" /></div>)}
                               {room.type === 'warehouse' && (<div className="absolute bottom-1 right-2 flex gap-1 items-end"><div className="w-4 h-4 bg-stone-700 border border-stone-600 rounded-sm flex items-center justify-center"><div className="w-2 h-0.5 bg-stone-500"></div></div><div className="w-3 h-3 bg-stone-700 border border-stone-600 rounded-sm"></div><div className="w-4 h-5 bg-stone-700 border border-stone-600 rounded-sm"></div></div>)}
                               {room.type === 'lab' && (<div className="absolute bottom-1 left-2 flex items-end gap-1"><div className="w-8 h-3 bg-stone-800 border-t border-stone-600"></div><FlaskConical className="w-3 h-3 text-indigo-400/50 absolute bottom-3 left-2" /></div>)}
                               {room.type === 'garage' && (<div className="absolute bottom-1 right-2 flex items-end"><CarFront className="w-8 h-8 text-stone-600 opacity-50" /></div>)}
                               {room.type === 'turret' && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><Crosshair className="w-10 h-10 text-red-500/30" /></div>)}
                               {room.type === 'radio' && (<div className="absolute bottom-1 right-2 flex flex-col items-center"><Radio className="w-6 h-6 text-teal-500/50" /></div>)}
                               {room.type === 'guard' && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><Shield className="w-10 h-10 text-green-500/20" /></div>)}
                               {room.type === 'project' && (<div className="absolute inset-0 flex items-center justify-center"><Rocket className="w-12 h-12 text-fuchsia-500/50 animate-pulse" /></div>)}

                               {room.status === 'fire' && <div className="absolute inset-0 bg-orange-600/30 flex items-center justify-center"><Flame className="w-8 h-8 text-orange-500 animate-pulse" /></div>}
                               {room.status === 'rats' && <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center"><Bug className="w-8 h-8 text-stone-500 animate-bounce" /></div>}
                               {room.status === 'riot' && <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center"><Hand className="w-6 h-6 text-red-400 animate-pulse" /><span className="text-[6px] font-bold text-red-300">БУНТ!</span></div>}
                            </div>

                            <div className="absolute inset-0 z-10 pointer-events-none">
                              {gameState.dwellers.filter(d => d.roomId === room.id).map(dweller => 
                                <Dweller 
                                   key={dweller.id} dweller={dweller} colorClass={theme.dweller} isPaused={hoveredRoomId === room.id} roomType={room.type} 
                                   isSelected={selectedDwellerId === dweller.id} onClick={(e) => handleDwellerClick(e, dweller.id)} 
                                />
                              )}
                            </div>

                            {/* Меню Крафта */}
                            {room.type === 'armory' && !gameState.isBlackout && room.status === 'normal' && (
                              <div className="absolute inset-0 z-20 flex flex-wrap items-center justify-center gap-1 bg-stone-900/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=20 && s.resources.mushrooms>=20){ s.resources.energy-=20; s.resources.mushrooms-=20; s.resources.weapons++; addLog(s,'🔨 Создано Оружие'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Оружие (20⚡ 20🍄)">🔫</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=30 && s.resources.droneParts>=1){ s.resources.energy-=30; s.resources.droneParts-=1; s.resources.armor++; addLog(s,'🔨 Создана Броня'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Тяжелая Броня (30⚡ 1⚙️)">🛡️</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=10 && s.resources.mushrooms>=30){ s.resources.energy-=10; s.resources.mushrooms-=30; s.resources.stimpaks++; addLog(s,'💉 Создан Стимпак'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Стимпак (10⚡ 30🍄)">💉</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=50 && s.resources.droneParts>=2){ s.resources.energy-=50; s.resources.droneParts-=2; s.resources.emp++; addLog(s,'💣 Создана ЭМИ'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="ЭМИ-граната (50⚡ 2⚙️)">💣</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=20 && s.resources.weapons>=1){ s.resources.energy-=20; s.resources.weapons-=1; s.resources.traps++; addLog(s,'🪤 Ловушка готова'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Ловушка для шлюза (20⚡ 1🔫)">🪤</button>
                              </div>
                            )}
                            {room.type === 'garage' && !gameState.isBlackout && room.status === 'normal' && (
                              <div className="absolute inset-0 z-20 flex flex-wrap items-center justify-center gap-1 bg-stone-900/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=50 && s.resources.droneParts>=3){ s.resources.energy-=50; s.resources.droneParts-=3; s.vehicles.motorcycle++; addLog(s,'🏍️ Мотоцикл собран!'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Мотоцикл [1 чел] (50⚡ 3⚙️)">🏍️</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=100 && s.resources.droneParts>=5){ s.resources.energy-=100; s.resources.droneParts-=5; s.vehicles.handcar++; addLog(s,'🚜 Дрезина готова!'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Дрезина [3 чел] (100⚡ 5⚙️)">🚜</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=200 && s.resources.droneParts>=10){ s.resources.energy-=200; s.resources.droneParts-=10; s.vehicles.jeep++; addLog(s,'🚙 Джип собран!'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Джип [4 чел] (200⚡ 10⚙️)">🚙</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=300 && s.resources.droneParts>=15){ s.resources.energy-=300; s.resources.droneParts-=15; s.vehicles.mech++; addLog(s,'🤖 Шагоход готов!'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Шагоход [2 чел, защита от кислоты] (300⚡ 15⚙️)">🤖</button>
                                 <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.energy>=50 && s.resources.droneParts>=3){ s.resources.energy-=50; s.resources.droneParts-=3; s.dwellers.push(createDweller(s.rooms.find(r=>r.type==='living')?.id||s.rooms[0].id,true,'drone')); addLog(s,'🤖 Дрон-Помощник!'); } }) }} className="text-[8px] sm:text-[10px] bg-stone-700 hover:bg-stone-600 border border-stone-500 p-0.5 rounded" title="Дрон-Помощник на базу (50⚡ 3⚙️)">🚁</button>
                              </div>
                            )}

                            <div className={`relative z-30 flex justify-between items-center px-1 py-0.5 border-b pointer-events-none transition-colors ${isBroken ? 'bg-red-950/80 border-red-800/50' : 'bg-stone-950/80 border-stone-800/50'}`}>
                              <div className="flex items-center gap-1 overflow-hidden pr-1">
                                <span className={`font-bold text-[8px] sm:text-[9px] ${theme.color} flex items-center gap-0.5 uppercase truncate`} title={room.name}>
                                  <Icon className="w-2 h-2 shrink-0"/> <span className="truncate">{room.name}</span>
                                </span>
                                <span className="text-[6px] sm:text-[7px] text-stone-500 font-bold uppercase tracking-widest shrink-0 hidden sm:inline">Ур.{room.level}</span>
                              </div>
                              
                              <div className="pointer-events-auto shrink-0">
                                {room.status === 'riot' ? (
                                  <div className="flex gap-0.5">
                                    <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.vodka>=10){s.resources.vodka-=10; s.rooms.find(r=>r.id===room.id).status='normal'; s.dwellers.forEach(d=>{if(d.roomId===room.id)d.morale=50;}); addLog(s,'🍸 Бунт подавлен выпивкой');} }); }} className="flex items-center justify-center w-4 h-4 sm:w-auto sm:px-1 sm:h-auto text-[7px] font-bold bg-purple-900/80 hover:bg-purple-800 text-stone-200 rounded border border-purple-700 transition-colors" title="Успокоить водкой (10🍸)">
                                      🍸 <span className="hidden sm:inline ml-0.5">10</span>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.weapons>=1){s.resources.weapons-=1; s.rooms.find(r=>r.id===room.id).status='normal'; s.dwellers.forEach(d=>{if(d.roomId===room.id && !d.isCompanion){if(Math.random()<0.2 && d.trait!=='leader')d.dead=true; d.morale=30;}}); s.dwellers=s.dwellers.filter(x=>!x.dead); addLog(s,'🔫 Бунт подавлен силой');} }); }} className="flex items-center justify-center w-4 h-4 sm:w-auto sm:px-1 sm:h-auto text-[7px] font-bold bg-red-900/80 hover:bg-red-800 text-stone-200 rounded border border-red-700 transition-colors" title="Подавить силой (1🔫)">
                                      🔫 <span className="hidden sm:inline ml-0.5">1</span>
                                    </button>
                                  </div>
                                ) : room.status === 'fire' ? (
                                  <button onClick={(e) => { e.stopPropagation(); mutateState(s => { if(s.resources.water>=10){s.resources.water-=10; s.rooms.find(r=>r.id===room.id).status='normal'; addLog(s,'🧯 Пожар потушен');} }); }} className="animate-pulse flex items-center justify-center w-4 h-4 sm:w-auto sm:px-1 sm:h-auto gap-0.5 text-[7px] font-bold bg-orange-900/80 hover:bg-orange-800 text-stone-200 rounded uppercase border border-orange-700 transition-colors" title="Тушить (10💧)">
                                    <Flame className="w-2 h-2" />
                                  </button>
                                ) : room.status === 'rats' ? (
                                  <div className="flex items-center justify-center w-4 h-4 sm:w-auto sm:px-1 sm:h-auto gap-0.5 text-[7px] font-bold bg-red-900/80 text-stone-200 rounded uppercase border border-red-700" title="Приведите бойца с оружием!">
                                    <Bug className="w-2 h-2 animate-bounce text-red-400" /> <span className="hidden sm:inline text-red-400">Нужен 🔫</span>
                                  </div>
                                ) : room.status === 'broken' ? (
                                  <button onClick={(e) => { e.stopPropagation(); mutateState(s => { s.rooms.find(r=>r.id===room.id).status='normal'; addLog(s,'🔧 Отсек восстановлен'); }); }} className="animate-pulse flex items-center justify-center w-4 h-4 sm:w-auto sm:px-1 sm:h-auto gap-0.5 text-[7px] font-bold bg-red-900/80 hover:bg-red-800 text-stone-200 rounded uppercase border border-red-700 transition-colors" title="Ремонт">
                                    <Wrench className="w-2 h-2" />
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); mutateState(s => { const c = room.level*50; if(s.resources.energy>=c){s.resources.energy-=c; s.rooms.find(r=>r.id===room.id).level++; addLog(s,'⬆️ Улучшено!');} }); }} className="flex items-center justify-center gap-0.5 text-[7px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-400 px-1 py-0.5 rounded uppercase border border-stone-600 transition-colors shadow-sm" title="Улучшить">
                                    <ArrowUpCircle className="w-2 h-2 shrink-0" /> <span className="hidden sm:inline">{room.level * UPGRADE_COST_BASE}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )})}
                        
                        {Array.from({ length: Math.max(0, MAX_ROOMS - gameState.rooms.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="relative h-24 border border-dashed border-stone-700 bg-stone-900/30 rounded flex flex-col items-center justify-center p-1">
                            <span className="text-[7px] sm:text-[8px] text-stone-500 font-bold uppercase tracking-widest mb-1 text-center leading-tight">Стройка<br/>({currentBuildCost.energy}⚡ {currentBuildCost.mushrooms}🍄)</span>
                            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
                              {!hasRoom('generator') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'generator', name:'Дизель', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Генератор (Топливо)"><Zap className="w-2.5 h-2.5 text-yellow-500"/></button>}
                              {!hasRoom('filter') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'filter', name:'ФВУ', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="ФВУ (Воздух)"><Wind className="w-2.5 h-2.5 text-stone-400"/></button>}
                              {!hasRoom('reservoir') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'reservoir', name:'Очистная', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Очистная (Вода)"><Droplet className="w-2.5 h-2.5 text-cyan-500"/></button>}
                              {!hasRoom('farm') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'farm', name:'Грибница', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Ферма (Грибы)"><Sprout className="w-2.5 h-2.5 text-amber-500"/></button>}
                              {!hasRoom('lab') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'lab', name:'Лаборатория', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Лаборатория (Наука за ⚡)"><FlaskConical className="w-2.5 h-2.5 text-indigo-400"/></button>}
                              
                              {!gameState.unlockedTech.warehouse ? <button onClick={() => mutateState(s => {if(s.resources.science>=20){s.resources.science-=20; s.unlockedTech.warehouse=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Склад (20🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Database className="w-2.5 h-2.5 text-stone-400/20 absolute top-1 left-1"/></button> : (!hasRoom('warehouse') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'warehouse', name:'Склад', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Склад (Вместимость: +50 ко всему)"><Database className="w-2.5 h-2.5 text-stone-400"/></button>)}
                              {!gameState.unlockedTech.bar ? <button onClick={() => mutateState(s => {if(s.resources.science>=40){s.resources.science-=40; s.unlockedTech.bar=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Бар (40🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Martini className="w-2.5 h-2.5 text-purple-400/20 absolute top-1 left-1"/></button> : (!hasRoom('bar') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'bar', name:'Бар', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Бар (Сильное восст. Морали за Водку)"><Martini className="w-2.5 h-2.5 text-purple-400"/></button>)}
                              {!gameState.unlockedTech.armory ? <button onClick={() => mutateState(s => {if(s.resources.science>=60){s.resources.science-=60; s.unlockedTech.armory=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Оружейную (60🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Swords className="w-2.5 h-2.5 text-stone-300/20 absolute top-1 left-1"/></button> : (!hasRoom('armory') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'armory', name:'Оружейная', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Оружейная (Крафт снаряжения)"><Swords className="w-2.5 h-2.5 text-stone-300"/></button>)}
                              {!gameState.unlockedTech.garage ? <button onClick={() => mutateState(s => {if(s.resources.science>=80){s.resources.science-=80; s.unlockedTech.garage=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Гараж (80🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><CarFront className="w-2.5 h-2.5 text-stone-400/20 absolute top-1 left-1"/></button> : (!hasRoom('garage') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'garage', name:'Гараж', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Гараж (Сборка Транспорта)"><CarFront className="w-2.5 h-2.5 text-stone-400"/></button>)}
                              {!gameState.unlockedTech.turret ? <button onClick={() => mutateState(s => {if(s.resources.science>=100){s.resources.science-=100; s.unlockedTech.turret=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Турели (100🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Crosshair className="w-2.5 h-2.5 text-red-400/20 absolute top-1 left-1"/></button> : (!hasRoom('turret') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'turret', name:'Турель', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Турель (Авто-ПВО, Бонус к Защите)"><Crosshair className="w-2.5 h-2.5 text-red-400"/></button>)}
                              {!gameState.unlockedTech.radio ? <button onClick={() => mutateState(s => {if(s.resources.science>=120){s.resources.science-=120; s.unlockedTech.radio=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Радиорубку (120🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Radio className="w-2.5 h-2.5 text-teal-400/20 absolute top-1 left-1"/></button> : (!hasRoom('radio') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'radio', name:'Радиорубка', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Радиорубка (Автоматический поиск частот)"><Radio className="w-2.5 h-2.5 text-teal-400"/></button>)}
                              {!gameState.unlockedTech.guard ? <button onClick={() => mutateState(s => {if(s.resources.science>=140){s.resources.science-=140; s.unlockedTech.guard=true;} })} className="p-0.5 sm:p-1 bg-stone-900 border border-stone-700 rounded relative group" title="Изучить Караулку (140🔬)"><Lock className="w-2.5 h-2.5 text-stone-600"/><Shield className="w-2.5 h-2.5 text-green-400/20 absolute top-1 left-1"/></button> : (!hasRoom('guard') && <button onClick={() => mutateState(s => { if(s.resources.energy>=currentBuildCost.energy && s.resources.mushrooms>=currentBuildCost.mushrooms){s.resources.energy-=currentBuildCost.energy; s.resources.mushrooms-=currentBuildCost.mushrooms; s.rooms.push({id:'r'+Date.now(), type:'guard', name:'Караулка', level:1, status:'normal'});} })} className="p-0.5 sm:p-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded" title="Караулка (Охранники принимают удар первыми)"><Shield className="w-2.5 h-2.5 text-green-400"/></button>)}
                              {!gameState.unlockedTech.project ? <button onClick={() => mutateState(s => {if(s.resources.science>=200){s.resources.science-=200; s.unlockedTech.project=true;} })} className="p-0.5 sm:p-1 bg-fuchsia-950/30 border border-fuchsia-900/50 rounded relative group animate-pulse" title="Изучить ПРОЕКТ ИСХОД (200🔬)"><Lock className="w-2.5 h-2.5 text-fuchsia-800"/><Rocket className="w-2.5 h-2.5 text-fuchsia-400/20 absolute top-1 left-1"/></button> : (!hasRoom('project') && <button onClick={() => mutateState(s => { if(s.resources.energy>=800 && s.resources.science>=200 && s.resources.droneParts>=15){s.resources.energy-=800; s.resources.science-=200; s.resources.droneParts-=15; s.rooms.push({id:'r'+Date.now(), type:'project', name:'Проект Исход', level:1, status:'normal'}); s.endgame={active:true,timer:0,won:false}; s.boss={active:true,hp:2000,laserTimer:0}; addLog(s,'🚀 ПРОЕКТ ИСХОД АКТИВИРОВАН!');} })} className="p-0.5 sm:p-1 bg-fuchsia-950/80 hover:bg-fuchsia-800 border border-fuchsia-500 rounded shadow-[0_0_10px_rgba(217,70,239,0.5)]" title="ПРОЕКТ ИСХОД: Путь к победе (800⚡ 200🔬 15⚙️)"><Rocket className="w-2.5 h-2.5 text-fuchsia-300"/></button>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-900 border border-stone-700 rounded flex flex-col h-[70vh] xl:h-full min-h-[400px]">
                    <div className="flex border-b border-stone-700 bg-stone-950 shrink-0">
                      <button onClick={() => setActiveTab('personnel')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'personnel' ? 'bg-stone-800 text-stone-200 border-b-2 border-stone-400' : 'text-stone-500 hover:bg-stone-900'}`}>Персонал</button>
                      <button onClick={() => setActiveTab('policies')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'policies' ? 'bg-stone-800 text-stone-200 border-b-2 border-stone-400' : 'text-stone-500 hover:bg-stone-900'}`}>Лидер/Законы</button>
                      <button onClick={() => setActiveTab('diplomacy')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'diplomacy' ? 'bg-stone-800 text-stone-200 border-b-2 border-stone-400' : 'text-stone-500 hover:bg-stone-900'}`}>Дипломатия</button>
                      <button onClick={() => setActiveTab('merchant')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider relative ${activeTab === 'merchant' ? 'bg-stone-800 text-stone-200 border-b-2 border-stone-400' : 'text-stone-500 hover:bg-stone-900'}`}>
                        Торговец {gameState.merchant.active && <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>}
                      </button>
                    </div>

                    <div className="p-2 flex-1 flex flex-col min-h-0 overflow-y-auto">
                      
                      {activeTab === 'policies' && (
                        <div className="space-y-3 flex flex-col h-full p-2">
                          <div className="bg-stone-950 border border-stone-800 rounded p-3 shrink-0 shadow-inner">
                            <h2 className="text-[10px] font-bold text-yellow-500 uppercase flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
                               <span className="flex items-center gap-1"><Star className="w-4 h-4"/> Командир (Ур. {gameState.commander.level})</span>
                               <span className="text-stone-400">{gameState.commander.xp} / {gameState.commander.level * 100} XP</span>
                            </h2>
                            <div className="w-full bg-stone-900 rounded-full h-1.5 mb-3"><div className="bg-yellow-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (gameState.commander.xp / (gameState.commander.level * 100)) * 100)}%` }}></div></div>
                            <p className="text-[9px] text-stone-500 mb-2">Очки навыков: {Math.max(0, gameState.commander.level - 1 - gameState.commander.perks.length)}</p>
                            
                            <div className="flex flex-col gap-2">
                                <button disabled={gameState.commander.level - 1 - gameState.commander.perks.length <= 0 || gameState.commander.perks.includes('hansa_discount')} onClick={() => mutateState(s => { s.commander.perks.push('hansa_discount'); addLog(s, `💡 Открыт перк!`); })} className={`text-[9px] p-2 rounded border text-left transition-colors ${gameState.commander.perks.includes('hansa_discount') ? 'bg-yellow-900/50 border-yellow-700 text-yellow-500' : 'bg-stone-900 border-stone-700 text-stone-400 hover:bg-stone-800 disabled:opacity-50'}`}>
                                   <b>Дипломат:</b> Скидка у торговцев Ганзы (+5)
                                </button>
                                <button disabled={gameState.commander.level - 1 - gameState.commander.perks.length <= 0 || gameState.commander.perks.includes('turrets')} onClick={() => mutateState(s => { s.commander.perks.push('turrets'); addLog(s, `💡 Открыт перк!`); })} className={`text-[9px] p-2 rounded border text-left transition-colors ${gameState.commander.perks.includes('turrets') ? 'bg-yellow-900/50 border-yellow-700 text-yellow-500' : 'bg-stone-900 border-stone-700 text-stone-400 hover:bg-stone-800 disabled:opacity-50'}`}>
                                   <b>Инженер:</b> Турели наносят в 2 раза больше урона
                                </button>
                                <button disabled={gameState.commander.level - 1 - gameState.commander.perks.length <= 0 || gameState.commander.perks.includes('storm_power')} onClick={() => mutateState(s => { s.commander.perks.push('storm_power'); addLog(s, `💡 Открыт перк!`); })} className={`text-[9px] p-2 rounded border text-left transition-colors ${gameState.commander.perks.includes('storm_power') ? 'bg-yellow-900/50 border-yellow-700 text-yellow-500' : 'bg-stone-900 border-stone-700 text-stone-400 hover:bg-stone-800 disabled:opacity-50'}`}>
                                   <b>Энергетик:</b> Ионные бури заряжают генератор (+5⚡/тик)
                                </button>
                            </div>
                          </div>

                          <div className="bg-stone-950 border border-stone-800 rounded p-3 shrink-0 shadow-inner">
                             <h2 className="text-[10px] font-bold text-stone-400 uppercase flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
                               <span className="flex items-center gap-1"><Scale className="w-4 h-4 text-stone-500"/> Политика Базы</span>
                             </h2>
                             <div className="space-y-3">
                               <label className="flex items-start gap-2 text-[10px] text-stone-300 cursor-pointer p-2 bg-stone-900 rounded border border-stone-700 hover:bg-stone-800 transition-colors">
                                 <input type="checkbox" checked={gameState.policies.rations} onChange={(e) => mutateState(s => s.policies.rations = e.target.checked)} className="mt-0.5" />
                                 <div><b>Двойные пайки:</b><br/><span className="text-[8px] text-stone-400">Мораль растет в 2 раза быстрее, но расход Воды и Грибов х2.</span></div>
                               </label>
                               <label className="flex items-start gap-2 text-[10px] text-stone-300 cursor-pointer p-2 bg-stone-900 rounded border border-stone-700 hover:bg-stone-800 transition-colors">
                                 <input type="checkbox" checked={gameState.policies.labor} onChange={(e) => mutateState(s => s.policies.labor = e.target.checked)} className="mt-0.5" />
                                 <div><b>Трудовая повинность:</b><br/><span className="text-[8px] text-stone-400">Выработка ресурсов +50%, но Мораль падает быстрее.</span></div>
                               </label>
                               <label className="flex items-start gap-2 text-[10px] text-stone-300 cursor-pointer p-2 bg-stone-900 rounded border border-stone-700 hover:bg-stone-800 transition-colors">
                                 <input type="checkbox" checked={gameState.policies.isolation} onChange={(e) => mutateState(s => s.policies.isolation = e.target.checked)} className="mt-0.5" />
                                 <div><b>Изоляция:</b><br/><span className="text-[8px] text-stone-400">Отменяет ИИ-квесты, беженцев и торговцев. НЛО не нападают.</span></div>
                               </label>
                             </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'personnel' && (
                        <div className="space-y-2 h-full overflow-y-auto pr-1">
                          <div className="text-[9px] text-stone-500 mb-2 leading-tight shrink-0">
                            * КЛИК: Выдели 🔫 🛡️ 💉, а затем кликни на жителя, чтобы выдать!<br/>
                            * ПЕРЕМЕЩЕНИЕ: Кликни на жителя, а затем на комнату!<br/>
                            * Кликни по имени, чтобы переименовать.
                          </div>
                          {gameState.dwellers.filter(d => !d.isCompanion).map(dweller => {
                            const isMutant = dweller.isMutant;
                            return (
                            <div 
                              key={dweller.id} 
                              onDragOver={handleDragOver} 
                              onDrop={(e) => handleEquipDrop(e, dweller.id)}
                              onClick={(e) => handleDwellerClick(e, dweller.id)}
                              className={`p-2 rounded border flex flex-col gap-1.5 relative overflow-hidden transition-colors shrink-0 ${isMutant ? 'bg-lime-950/30 border-lime-800' : 'bg-stone-950 border-stone-800'} ${selectedDwellerId === dweller.id ? 'ring-2 ring-white scale-[1.02]' : selectedEquip ? 'cursor-pointer hover:border-white' : 'cursor-pointer'}`}
                            >
                              <div className="absolute left-0 bottom-0 h-0.5 bg-blue-500/50 transition-all" style={{ width: `${dweller.morale || 0}%` }}></div>
                              
                              <div className="flex justify-between items-start z-10 pointer-events-none">
                                <div className="flex items-center gap-1.5 pointer-events-auto">
                                  <span title={isMutant ? 'Мутант' : TRAITS.find(t => t.id === dweller.trait)?.desc}>{isMutant ? (TRAITS.find(t => t.id === dweller.trait)?.icon || '🧟') : TRAITS.find(t => t.id === dweller.trait)?.icon}</span>
                                  
                                  {editingDweller === dweller.id ? (
                                    <input type="text" autoFocus defaultValue={dweller.name} onBlur={(e) => renameDweller(dweller.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') renameDweller(dweller.id, e.target.value) }} className="text-[10px] font-bold bg-stone-800 text-stone-200 border border-stone-600 rounded px-1 outline-none w-20" />
                                  ) : (
                                    <span onClick={(e) => { e.stopPropagation(); setEditingDweller(dweller.id); }} className={`font-bold text-[10px] ${isMutant ? 'text-lime-400' : dweller.trait === 'leader' ? 'text-yellow-500' : 'text-stone-200'} flex items-center gap-1 cursor-pointer hover:text-white hover:underline decoration-stone-500 decoration-dashed`}>
                                      {dweller.name}
                                      {dweller.isCyborg && <Cpu className="w-3 h-3 text-cyan-400" title="Киборг"/>}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 pointer-events-auto">
                                  <span className={`text-[8px] font-bold ${(dweller.morale || 0) < 30 && !dweller.isCyborg && !isMutant && dweller.trait !== 'leader' ? 'text-red-500' : (isMutant || dweller.trait === 'leader') ? 'text-lime-500' : 'text-stone-500'}`}>МРЛ: {Math.floor(dweller.morale || 0)}</span>
                                  {dweller.isSick && <button onClick={(e) => { e.stopPropagation(); mutateState(s => cyborgizeDweller(s, dweller.id)); }} className="bg-cyan-900/40 text-cyan-400 text-[8px] font-bold px-1 py-0.5 rounded border border-cyan-900 uppercase" title="Киборгизировать (1⚙️ + 30⚡)">🦾</button>}
                                </div>
                              </div>

                              <div className="flex justify-between items-center z-10 mt-1 pointer-events-none">
                                 <div className="flex flex-wrap gap-1 text-[8px] text-stone-500">
                                   {dweller.skills?.generator > 1 && <span title="Инженерия" className="flex items-center text-yellow-500/70"><Zap className="w-2 h-2"/>{dweller.skills.generator}</span>}
                                   {dweller.skills?.filter > 1 && <span title="Вентиляция" className="flex items-center text-stone-400/70"><Wind className="w-2 h-2"/>{dweller.skills.filter}</span>}
                                   {dweller.skills?.reservoir > 1 && <span title="Водоочистка" className="flex items-center text-cyan-500/70"><Droplet className="w-2 h-2"/>{dweller.skills.reservoir}</span>}
                                   {dweller.skills?.farm > 1 && <span title="Ботаника" className="flex items-center text-amber-500/70"><Sprout className="w-2 h-2"/>{dweller.skills.farm}</span>}
                                   {dweller.skills?.medbay > 1 && <span title="Медицина" className="flex items-center text-red-500/70"><Heart className="w-2 h-2"/>{dweller.skills.medbay}</span>}
                                   {dweller.skills?.armory > 1 && <span title="Боевик" className="flex items-center text-stone-300/70"><Swords className="w-2 h-2"/>{dweller.skills.armory}</span>}
                                   {dweller.skills?.lab > 1 && <span title="Ученый" className="flex items-center text-indigo-400/70"><FlaskConical className="w-2 h-2"/>{dweller.skills.lab}</span>}
                                   {dweller.skills?.radio > 1 && <span title="Связист" className="flex items-center text-teal-400/70"><Radio className="w-2 h-2"/>{dweller.skills.radio}</span>}
                                   {dweller.skills?.guard > 1 && <span title="Охранник" className="flex items-center text-green-500/70"><Shield className="w-2 h-2"/>{dweller.skills.guard}</span>}
                                 </div>
                                 
                                 {dweller.roomId !== 'surface' && (
                                   dweller.equipped === 'weapon' ? <span className="text-[8px] text-stone-300 flex items-center gap-0.5 bg-stone-800 px-1 py-0.5 rounded border border-stone-600"><Swords className="w-2 h-2"/> Оружие</span> :
                                   dweller.equipped === 'armor' ? <span className="text-[8px] text-stone-300 flex items-center gap-0.5 bg-stone-800 px-1 py-0.5 rounded border border-stone-600"><ShieldHalf className="w-2 h-2"/> Броня</span> :
                                   dweller.equipped === 'stimpak' ? <span className="text-[8px] text-green-400 flex items-center gap-0.5 bg-green-900/30 px-1 py-0.5 rounded border border-green-800"><Syringe className="w-2 h-2"/> Стимпак</span> :
                                   <span className="text-[8px] text-stone-600 border border-dashed border-stone-700 px-1 py-0.5 rounded">Пусто</span>
                                 )}
                              </div>
                            </div>
                          )})}
                        </div>
                      )}

                      {activeTab === 'diplomacy' && (
                        <div className="flex flex-col h-full gap-4 p-2">
                          <div className="bg-stone-950 border border-stone-800 p-3 rounded">
                            <h3 className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4"/> Ганза (Торговцы)</h3>
                            <p className="text-[9px] text-stone-400 mb-2">Репутация: {gameState.factions.hansa} (Скидка: {Math.floor(gameState.factions.hansa/20)} Грибов)</p>
                            <div className="w-full bg-stone-900 rounded-full h-1.5 mb-3"><div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, gameState.factions.hansa)}%` }}></div></div>
                            <button onClick={() => mutateState(s => sendCaravan(s, 'hansa'))} className="w-full bg-stone-900 hover:bg-stone-800 border border-stone-700 p-2 rounded text-[9px] text-stone-300 transition-colors">
                              Отправить Дары (50⚡ 50💧)
                            </button>
                          </div>
                          
                          <div className="bg-stone-950 border border-stone-800 p-3 rounded">
                            <h3 className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-2 mb-2"><Target className="w-4 h-4"/> Спарта (Военные)</h3>
                            <p className="text-[9px] text-stone-400 mb-2">Репутация: {gameState.factions.sparta} (Защита: +{Math.floor(gameState.factions.sparta/10)})</p>
                            <div className="w-full bg-stone-900 rounded-full h-1.5 mb-3"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, gameState.factions.sparta)}%` }}></div></div>
                            <button onClick={() => mutateState(s => sendCaravan(s, 'sparta'))} className="w-full bg-stone-900 hover:bg-stone-800 border border-stone-700 p-2 rounded text-[9px] text-stone-300 transition-colors">
                              Поставить Оружие (5🔫)
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === 'merchant' && (
                        <div className="flex flex-col h-full justify-center">
                          {gameState.merchant.active ? (
                            <div className="bg-stone-950 border border-stone-800 p-3 rounded text-center">
                              <ShoppingCart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <h3 className="text-[10px] font-bold text-stone-300 uppercase mb-3">Караван Сопротивления</h3>
                              <p className="text-[9px] text-stone-500 mb-4">Уйдет через: {gameState.merchant.timer} сек.</p>
                              
                              <div className="space-y-2">
                                <button onClick={() => mutateState(s => trade(s, 'energy'))} className="w-full flex justify-between items-center bg-stone-900 hover:bg-stone-800 p-2 rounded border border-stone-700 transition-colors">
                                  <span className="text-[9px] text-stone-400">Купить 10 <Zap className="w-2.5 h-2.5 inline text-yellow-500"/></span>
                                  <span className="text-[9px] font-bold text-amber-500">Цена: {Math.max(1, gameState.merchant.rates.buyEnergy - Math.floor(gameState.factions.hansa/20) - (gameState.commander.perks.includes('hansa_discount')?5:0))} 🍄</span>
                                </button>
                                <button onClick={() => mutateState(s => trade(s, 'air'))} className="w-full flex justify-between items-center bg-stone-900 hover:bg-stone-800 p-2 rounded border border-stone-700 transition-colors">
                                  <span className="text-[9px] text-stone-400">Купить 10 <Wind className="w-2.5 h-2.5 inline text-stone-400"/></span>
                                  <span className="text-[9px] font-bold text-amber-500">Цена: {Math.max(1, gameState.merchant.rates.buyAir - Math.floor(gameState.factions.hansa/20) - (gameState.commander.perks.includes('hansa_discount')?5:0))} 🍄</span>
                                </button>
                                <button onClick={() => mutateState(s => trade(s, 'weapons'))} className="w-full flex justify-between items-center bg-stone-900 hover:bg-stone-800 p-2 rounded border border-stone-700 transition-colors">
                                  <span className="text-[9px] text-stone-400">Купить 1 <Swords className="w-2.5 h-2.5 inline text-stone-200"/></span>
                                  <span className="text-[9px] font-bold text-purple-400">Цена: {Math.max(1, gameState.merchant.rates.buyWeapon - Math.floor(gameState.factions.hansa/20) - (gameState.commander.perks.includes('hansa_discount')?5:0))} 🍸</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-stone-600 py-10">
                              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-[10px] uppercase font-bold">Торговцев нет</p>
                              <p className="text-[8px] mt-1">Они приходят редко и ненадолго.</p>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
          );
        }

        function ResourceIndicator({ icon, value, color, label, isInt = false, max = null }) {
          const safeValue = isNaN(value) || value === undefined ? 0 : value;
          const isLow = safeValue < 10 && !isInt;
          return (
            <div className={`flex flex-col items-center ${isLow ? 'animate-pulse' : ''}`} title={label}>
              <div className={`flex items-center gap-0.5 text-sm sm:text-base font-black ${isLow ? 'text-red-500 drop-shadow-[0_0_5px_#ef4444]' : color}`}>
                {icon} <span>{Math.floor(safeValue)}{max ? <span className="text-[10px] text-stone-600">/{max}</span> : ''}</span>
              </div>
            </div>
          );
        }

export default App;
