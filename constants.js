// =============================================
// constants.js — 변하지 않는 숫자/설정값 모음
// =============================================

const TILE_SIZE = 14; // 확장된 65맵에 최적화되도록 조절 (기존 18 -> 14)
const COLS = 65;      // 맵 크기 확장 (65)
const ROWS = 65;      // 맵 크기 확장 (65)
const CANVAS_W = COLS * TILE_SIZE;  // 910
const CANVAS_H = ROWS * TILE_SIZE;  // 910

// 게임 시간 (초)
const GAME_TOTAL_TIME = 120;
const BETRAYAL_TRIGGER_TIME = 60;

// 협력 페이즈 한 명 사망 시 특수 규칙
const SOLO_TIME_LIMIT = 20;         
const EMERGENCY_BETRAYAL_TIME = 30; 

// 플레이어 속도
const PLAYER_SPEED = 8;
const BOOST_MULTIPLIER = 2.0;
const BOOST_DURATION = 150;      
const STEEL_TAIL_DURATION = 150; 

// 좀비
const ZOMBIE_COUNT = 6;
const ZOMBIE_SPEED_NORMAL = 4.8;   // 플레이어보다 확실히 느리도록 밸런스 조정
const ZOMBIE_SPEED_BOOSTED = 11;   
const ZOMBIE_BLOOD_DURATION = 150; 
const ZOMBIE_RANDOM_CHANCE = 0.03;

// 랜덤 박스
const BOX_COUNT_EACH = 4; // 넓어진 맵에 맞춰 상자 배치 개수 증가
const BOMB_RADIUS = 3;

// 타일 소유자 상수
const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

// 랜덤 박스 타입
const BOX_TYPE_MEDICINE = 'medicine'; 
const BOX_TYPE_BLOOD    = 'blood';    
const BOX_TYPE_ENERGY   = 'energy';   

// 게임 페이즈
const PHASE_LOBBY    = 'lobby';
const PHASE_COOP     = 'coop';
const PHASE_SOLO     = 'solo';     
const PHASE_BETRAYAL = 'betrayal';
const PHASE_END      = 'end';

// 색상
const COLOR_TEAM   = '#4CAF50';
const COLOR_A      = '#E53935';
const COLOR_B      = '#1E88E5';
const COLOR_ZOMBIE = '#7B1FA2';
const COLOR_EMPTY  = '#1a1a1a';
const COLOR_GRID   = '#222222';

const FRAME_RATE = 30;
