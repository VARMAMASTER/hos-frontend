import { AiMark, type AiMarkProps } from './ai-mark';

export type SparkleClusterProps = Pick<AiMarkProps, 'className' | 'size'>;

// @deprecated The three-star cluster is gone: the one AI mark is the Care spark. Use AiMark. This
// alias renders it, so nothing outside Nova breaks.
export function SparkleCluster(props: SparkleClusterProps) {
  return <AiMark {...props} />;
}
