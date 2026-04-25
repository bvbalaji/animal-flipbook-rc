export type AnimalType = 'domestic' | 'wild';
export type FilterType = 'all' | AnimalType;

export interface Animal {
  emoji: string;
  name: string;
  type: AnimalType;
  desc: string;
  fact: string;
}
