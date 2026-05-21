// constants.js — 게임의 전역 설정 상수가 정의된 파일

const TILE_SIZE = 16;
const COLS = 60; // 맵 크기 확장
const ROWS = 60;
const CANVAS_W = COLS * TILE_SIZE;
const CANVAS_H = ROWS * TILE_SIZE;
const FRAME_RATE = 30;

// 전체 게임 제한시간 규칙 조율
const GAME_TOTAL_TIME = 60;        // 전체 1분 (60초)
const BETRAYAL_TRIGGER_TIME = 20;  // 배신 타이머 잔여 시간 20초

const SOLO_TIME_LIMIT = 30;         // 한 명 사망 시 남은 사람 타임어택 30초 제한
const EMERGENCY_BETRAYAL_TIME = 30; // 부활 즉시 배신 타이머 30초 세팅

// 플레이어 속도
const PLAYER_SPEED = 7.0;             
const BOOST_MULTIPLIER = 2.0;       
const ITEM_DURATION = 150;          // 아이템 지속 시간 5초 (150프레임)

// 좀비 설정 (플레이어보다 살짝 느리게 조율)
const ZOMBIE_COUNT = 6;             
const ZOMBIE_MAX = 15;              // 좀비 계속 생성될 수 있는 최대 수
const ZOMBIE_SPEED_NORMAL = 5.0;    // 플레이어(7.0)보다 살짝 느린 속도
const ZOMBIE_SPEED_BOOSTED = 10.0;  // 피 밟았을 때 폭주 속도
const ZOMBIE_SPAWN_INTERVAL = 150;  // 좀비 리스폰 주기 (5초)
const ZOMBIE_RANDOM_CHANCE = 0.15;  

const BOX_COUNT_EACH = 4;           // 종류별 박스 개수
const BONUS_LAND_RADIUS = 3;        // 약 획득 시 보너스 땅 지급 반경

// 페이즈 상태 상수 정의
const PHASE_LOBBY = 'LOBBY';
const PHASE_COOP = 'COOP';          
const PHASE_SOLO = 'SOLO';          
const PHASE_BETRAYAL = 'BETRAYAL';  
const PHASE_END = 'END';

// 소유권 정의
const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

// [오류 해결 핵심] 에러가 났던 타일 노말 타입을 상수로 완벽히 정의
const TILE_TYPE_NORMAL = 'normal';

// 랜덤 박스 아이템 타입 정의
const BOX_TYPE_MEDICINE = 'medicine'; 
const BOX_TYPE_BLOOD    = 'blood';    
const BOX_TYPE_ENERGY   = 'energy';   

// 색상 정의
const COLOR_EMPTY = '#1A1A24';
const COLOR_GRID = '#2D2D3D';
const COLOR_TEAM = '#4CAF50';
const COLOR_A = '#2196F3';
const COLOR_B = '#9C27B0';
const COLOR_ZOMBIE = '#795548';
