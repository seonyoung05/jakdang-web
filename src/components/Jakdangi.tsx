/**
 * 작당이 (피그마 'JD/작당이 (임시)' 컴포넌트).
 * 아트는 public/jakdangi/*.svg — 최종 캐릭터가 나오면 이 SVG 파일만 바꾸면 전 화면에 반영된다.
 * - 찡긋(sly) = 기본, 속닥속닥(whisper) = 방금 합류, 만세(joy) = 작당 성공, 빈자리(empty) = 아직 안 온 자리
 */
export type JakdangiColor = 'peach' | 'yellow' | 'sky';
export type JakdangiMood = 'sly' | 'whisper' | 'joy';

const COLORS: JakdangiColor[] = ['peach', 'yellow', 'sky'];

/** 같은 사람은 어느 화면에서나 같은 색이 되도록 id로 색을 정한다 */
export function colorFor(id: string | number): JakdangiColor {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function colorAt(index: number): JakdangiColor {
  return COLORS[((index % 3) + 3) % 3];
}

export default function Jakdangi({
  color = 'peach',
  mood = 'sly',
  empty = false,
  size = 30,
  label,
  className = '',
}: {
  color?: JakdangiColor;
  mood?: JakdangiMood;
  empty?: boolean;
  size?: number;
  label?: string;
  className?: string;
}) {
  const src = empty ? '/jakdangi/empty.svg' : `/jakdangi/${color}-${mood}.svg`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={`block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** 겹쳐 놓은 작당이 줄 (메인 카드, 꾸미기 미리보기) */
export function JakdangiRow({
  members,
  max,
  size = 30,
  overlap = 3,
  limit = 8,
  mood = 'sly',
}: {
  members: { id: string; name: string }[];
  max: number;
  size?: number;
  overlap?: number;
  limit?: number;
  mood?: JakdangiMood;
}) {
  const shown = Math.min(max, limit);
  const cells = Array.from({ length: shown }, (_, i) => members[i]);
  return (
    <div className="flex items-center" role="img" aria-label={`정원 ${max}명 중 ${members.length}명`}>
      {cells.map((m, i) => (
        <span key={i} style={{ marginRight: i === shown - 1 ? 0 : -overlap }}>
          {m ? <Jakdangi color={colorFor(m.id)} mood={mood} size={size} /> : <Jakdangi empty size={size} />}
        </span>
      ))}
      {max > shown ? <span className="ml-1.5 text-[11px] font-bold text-ink-2">+{max - shown}</span> : null}
    </div>
  );
}
