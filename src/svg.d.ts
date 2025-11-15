// src/svg.d.ts

// กรณีใช้งานเป็น React component: import Icon from './file.svg?component'
declare module '*.svg?component' {
  import * as React from 'react';
  const SVGComponent: React.FunctionComponent<
    React.SVGAttributes<SVGSVGElement> & { title?: string }
  >;
  export default SVGComponent;
}

// กรณีใช้งานเป็น URL: import url from './file.svg'
declare module '*.svg' {
  const url: string;
  export default url;
}
