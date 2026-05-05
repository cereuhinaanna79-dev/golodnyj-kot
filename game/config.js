//настройки (константы)
export const LEVEL_TARGETS = [3, 4, 5];//сколько мышек нужно поймать на каждом уровне
export const POINTS_PER_MOUSE = 1;//кол-во очков за одну мышку
export const TOTAL_LEVELS = LEVEL_TARGETS.length;//количество уровней (вычисляется один раз при загрузке файла)
export const MAX_SCORE = LEVEL_TARGETS.reduce((sum, target) => sum + target, 0);
//максимальное количество очков в игре - 12
//export - для того, чтобы можно было осуществлять импорт 