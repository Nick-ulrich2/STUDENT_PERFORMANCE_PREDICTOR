import { Reveal } from '@/components/ui/Reveal';

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  center = false,
}: SectionIntroProps) {
  return (
    <Reveal>
      <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
        {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
        <h2 className="font-display text-4xl leading-[1.08] tracking-[-.025em] text-navy md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-5 text-lg leading-8 text-ink/65">{description}</p>
        )}
      </div>
    </Reveal>
  );
}
