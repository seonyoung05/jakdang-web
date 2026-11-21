/**
 * 작당이: 작당모임 캐릭터. 역할은 없고, 참여 순서(index)대로 색이 돌아가며 붙는다.
 * - sly: 찡긋 (기본)
 * - whisper: 속닥속닥 (기본, sly와 번갈아 사용)
 * - joy: 만세 (작당 성공)
 * - sleepy: 눈 감음 (빈 화면)
 * - empty: 빈자리 (점선)
 */
export type JakdangiMood = 'sly' | 'whisper' | 'joy' | 'sleepy' | 'empty';

export const JAKDANGI_COLORS = ['#FFC9AC', '#FFE07D', '#B8DEF2'];
const INK = '#2B2420';

export function jakdangiColor(index: number) {
  return JAKDANGI_COLORS[((index % JAKDANGI_COLORS.length) + JAKDANGI_COLORS.length) % JAKDANGI_COLORS.length];
}

/** 참여 순서로 기본 표정을 정한다 (짝수 찡긋, 홀수 속닥) */
export function jakdangiMood(index: number): JakdangiMood {
  return index % 2 ? 'whisper' : 'sly';
}

export default function Jakdangi({
  mood = 'sly',
  index = 0,
  color,
  size = 48,
  label,
}: {
  mood?: JakdangiMood;
  index?: number;
  color?: string;
  size?: number;
  label?: string;
}) {
  const fill = color ?? jakdangiColor(index);
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };

  if (mood === 'empty') {
    return (
      <svg width={size} height={size} viewBox="-30 -56 60 62" {...a11y}>
        <path
          d="M-21 -19 Q-21 -49 0 -49 Q21 -49 21 -19 Q21 -3 0 -3 Q-21 -3 -21 -19Z"
          fill="#fff"
          fillOpacity={0.75}
          stroke="#D8C9BA"
          strokeWidth={1.6}
          strokeDasharray="4 4"
        />
        <path d="M-4.5 -30 q4.5 -7 9 0 q0 4.5 -4.5 6.5 v3 M0 -15.5 v.5" stroke="#CBB9A8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  const eye = (x: number) => (
    <>
      <ellipse cx={x} cy={-29} rx={3.2} ry={3.9} fill={INK} />
      <circle cx={x - 1} cy={-30.4} r={1.25} fill="#fff" />
    </>
  );

  return (
    <svg width={size} height={size} viewBox="-30 -56 60 62" style={{ overflow: 'visible' }} {...a11y}>
      <ellipse cx={0} cy={2} rx={20} ry={3.5} fill={INK} opacity={0.08} />
      {/* 팔 */}
      {mood === 'joy' ? (
        <>
          <ellipse cx={-24} cy={-38} rx={5} ry={8} transform="rotate(-25 -24 -38)" fill={fill} />
          <ellipse cx={24} cy={-38} rx={5} ry={8} transform="rotate(25 24 -38)" fill={fill} />
        </>
      ) : (
        <>
          <ellipse cx={-21} cy={-16} rx={4.5} ry={6.5} transform="rotate(20 -21 -16)" fill={fill} />
          {mood !== 'whisper' ? <ellipse cx={21} cy={-16} rx={4.5} ry={6.5} transform="rotate(-20 21 -16)" fill={fill} /> : null}
        </>
      )}
      {/* 발 */}
      <ellipse cx={-9} cy={-1} rx={6.5} ry={3.8} fill={fill} />
      <ellipse cx={9} cy={-1} rx={6.5} ry={3.8} fill={fill} />
      <ellipse cx={-9} cy={-1} rx={6.5} ry={3.8} fill={INK} opacity={0.1} />
      <ellipse cx={9} cy={-1} rx={6.5} ry={3.8} fill={INK} opacity={0.1} />
      {/* 몸 */}
      <path d="M-22 -19 Q-22 -50 0 -50 Q22 -50 22 -19 Q22 -2 0 -2 Q-22 -2 -22 -19Z" fill={fill} />
      <ellipse cx={-12} cy={-40} rx={5} ry={3} fill="#fff" opacity={0.45} />
      {/* 얼굴 */}
      {mood === 'joy' ? (
        <>
          <path d="M-11 -28 q3.5 -4.5 7 0 M4 -28 q3.5 -4.5 7 0" stroke={INK} strokeWidth={2.3} fill="none" strokeLinecap="round" />
          <path d="M-6 -22 Q0 -12 6 -22Z" fill={INK} />
          <path d="M-3 -17.5 Q0 -15 3 -17.5" stroke="#FF7A6B" strokeWidth={2.2} strokeLinecap="round" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <path d="M-11 -29 q3.5 3 7 0 M4 -29 q3.5 3 7 0" stroke={INK} strokeWidth={2.3} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={-20} r={2} fill={INK} />
        </>
      ) : mood === 'sly' ? (
        <>
          <path d="M-11.5 -29 q3.5 -4 7 0" stroke={INK} strokeWidth={2.3} fill="none" strokeLinecap="round" />
          {eye(8)}
          <path d="M-5 -21 q2.5 3 5 0 q2.5 3 5 0" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M1.5 -19.6 q1.6 3.4 3.6 .3" fill="#FF7A6B" />
        </>
      ) : (
        <>
          {eye(-6)}
          {eye(9)}
          <path d="M-3 -21 q2.5 3 5 0 q2.5 3 5 0" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
          <ellipse cx={16} cy={-22} rx={6} ry={7} fill={fill} />
          <ellipse cx={16} cy={-22} rx={6} ry={7} fill={INK} opacity={0.06} />
        </>
      )}
      {/* 볼터치 */}
      <ellipse cx={-14} cy={-21} rx={4.6} ry={2.7} fill="#FF6E5C" opacity={0.38} />
      <ellipse cx={14} cy={-21} rx={4.6} ry={2.7} fill="#FF6E5C" opacity={0.38} />
    </svg>
  );
}
