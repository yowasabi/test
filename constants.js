// constants.js — 게임 상수 및 설정

// 1. 맵 크기 확장 (기존 50x50 -> 60x60)
const TILE_SIZE = 16;
const COLS = 60; 
const ROWS = 60;
const CANVAS_W = COLS * TILE_SIZE;
const CANVAS_H = ROWS * TILE_SIZE;

const FRAME_RATE = 30;

// 2. 게임 시간 규칙 (전체 1분, 배신타이머 20초)
const GAME_TOTAL_TIME = 60;        
const BETRAYAL_TRIGGER_TIME = 20;  

const SOLO_TIME_LIMIT = 30;         // 독자생존 제한시간 30초
const EMERGENCY_BETRAYAL_TIME = 30; // 부활 후 배신타이머 30초

// 3. 플레이어 속도 설정 (좀비보다 살짝 빠르게)
const PLAYER_SPEED = 8;             
const BOOST_MULTIPLIER = 2.0;       // 에너지드링크 2배 속도
const ITEM_DURATION = 150;          // 5초 (5초 * 30fps)

// 4. 좀비 설정 (플레이어보다 살짝 느린 속도 및 지속 스폰)
const ZOMBIE_COUNT = 6;             // 초기 스폰 수
const ZOMBIE_MAX = 15;              // 최대 좀비 수 제한
const ZOMBIE_SPEED_NORMAL = 6.0;    // 플레이어(8)보다 살짝 느림
const ZOMBIE_SPEED_BOOSTED = 11.0;  // 피 획득 시 폭주 속도
const ZOMBIE_SPAWN_INTERVAL = 150;  // 5초마다 추가 생성
const ZOMBIE_RANDOM_CHANCE = 0.15;  

// 5. 랜덤박스 설정 (종류별 4개씩 배치)
const BOX_COUNT_EACH = 4;           
const BONUS_LAND_RADIUS = 3;        

// 6. 상태 및 진영 고유 소유권 키값
const PHASE_LOBBY = 'LOBBY';
const PHASE_COOP = 'COOP';          
const PHASE_SOLO = 'SOLO';          
const PHASE_BETRAYAL = 'BETRAYAL';  
const PHASE_END = 'END';

const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

const BOX_TYPE_MEDICINE = 'medicine'; 
const BOX_TYPE_BLOOD    = 'blood';    
const BOX_TYPE_ENERGY   = 'energy';   

// 테마 색상 설정
const COLOR_EMPTY = '#1A1A24';
const COLOR_GRID = '#2D2D3D';
const COLOR_TEAM = '#4CAF50';
const COLOR_A = '#2196F3';
const COLOR_B = '#9C27B0';
const COLOR_ZOMBIE = '#795548';
