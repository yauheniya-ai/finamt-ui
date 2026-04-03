// ---------------------------------------------------------------------------
// Inline SVG icon components — used instead of @iconify/react for offline support.
// Add new icons here as needed; keep @iconify/react only for icons not yet inlined.
// ---------------------------------------------------------------------------

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IconDelete(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="M19.45 7.5H4.55a.5.5 0 0 0-.5.54l1.28 14.14a2 2 0 0 0 2 1.82h9.34a2 2 0 0 0 2-1.82L20 8a.5.5 0 0 0-.5-.54Zm-9.2 13a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 1.5 0Zm5 0a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 1.5 0ZM22 4h-4.75a.25.25 0 0 1-.25-.25V2.5A2.5 2.5 0 0 0 14.5 0h-5A2.5 2.5 0 0 0 7 2.5v1.25a.25.25 0 0 1-.25.25H2a1 1 0 0 0 0 2h20a1 1 0 0 0 0-2M9 3.75V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v1.25a.25.25 0 0 1-.25.25h-5.5A.25.25 0 0 1 9 3.75"
      />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
      />
    </svg>
  );
}

export function IconDatabase(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4s8-1.79 8-4s-3.58-4-8-4M4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4m0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}

export function IconDatabaseOff(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="M12 21q-1.025 0-2.562-.213T6.475 20.1t-2.45-1.237T3 17v-2.5q0 1.1 1.025 1.863t2.45 1.237t2.963.688T12 18.5q1.05 0 2.588-.213t2.987-.712l1.75 1.75q-1.55.9-3.75 1.288T12 21m8.775-3.05l-1.25-1.25q.675-.425 1.075-.975T21 14.5V17q0 .275-.05.5t-.175.45M12 16q-1.025 0-2.563-.213T6.475 15.1t-2.45-1.237T3 12V9.5q0 1.1 1.025 1.863t2.45 1.237t2.963.688T12 13.5q.3 0 .663-.012t.762-.063L15.6 15.6q-1.025.2-1.962.3T12 16m5.825-1l-1.95-1.95q1.925-.425 3.525-1.275T21 9.5V12q0 1.05-.913 1.788T17.825 15m-6.85-4.025q-3.4-.175-5.687-1.3T3 7q0-.65.438-1.237t1.237-1.088zm2.775-.05L6.625 3.8q1.125-.375 2.488-.587T12 3q3.75 0 6.375 1.175T21 7q0 1.45-2.062 2.55t-5.188 1.375M19.075 21.9L2.1 4.925q-.275-.275-.275-.687t.275-.713q.3-.3.713-.3t.712.3L20.5 20.5q.3.3.288.7t-.313.7q-.3.275-.7.288t-.7-.288"
      />
    </svg>
  );
}

export function IconDatabaseCheck(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="M12 3c4.42 0 8 1.79 8 4s-3.58 4-8 4s-8-1.79-8-4s3.58-4 8-4M4 9c0 2.21 3.58 4 8 4s8-1.79 8-4v3.08L19 12c-2.59 0-4.8 1.64-5.64 3.94L12 16c-4.42 0-8-1.79-8-4zm0 5c0 2.21 3.58 4 8 4h1c0 1.05.27 2.04.75 2.9L12 21c-4.42 0-8-1.79-8-4zm14 7.08l-2.75-3l1.16-1.16L18 18.5l3.59-3.58l1.16 1.41z"
      />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" {...props}>
      <rect width="20" height="20" fill="none" />
      <path
        fill="currentColor"
        d="M4.516 7.548c.436-.446 1.043-.481 1.576 0L10 11.295l3.908-3.747c.533-.481 1.141-.446 1.574 0c.436.445.408 1.197 0 1.615c-.406.418-4.695 4.502-4.695 4.502a1.095 1.095 0 0 1-1.576 0S4.924 9.581 4.516 9.163s-.436-1.17 0-1.615"
      />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <path
        fill="currentColor"
        d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V5q0-.425.288-.712T19 4t.713.288T20 5v5q0 .425-.288.713T19 11h-5q-.425 0-.712-.288T13 10t.288-.712T14 9h3.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.7 0 3.113-.862t2.187-2.313q.2-.35.563-.487t.737-.013q.4.125.575.525t-.025.75q-1.025 2-2.925 3.2T12 20"
      />
    </svg>
  );
}

export function IconPlusCircle(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
        <path d="M12 17a1 1 0 0 1-1-1V8a1 1 0 1 1 2 0v8a1 1 0 0 1-1 1" />
        <path d="M17 12a1 1 0 0 1-1 1H8a1 1 0 1 1 0-2h8a1 1 0 0 1 1 1" />
        <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-10 8a8 8 0 1 0 0-16a8 8 0 0 0 0 16" />
      </g>
    </svg>
  );
}

export function IconSpinner(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" fill="none" />
      <defs>
        <filter id="finamt-spinner-filter">
          <feGaussianBlur in="SourceGraphic" result="y" stdDeviation="1" />
          <feColorMatrix in="y" result="z" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" />
          <feBlend in="SourceGraphic" in2="z" />
        </filter>
      </defs>
      <g filter="url(#finamt-spinner-filter)">
        <circle cx="5" cy="12" r="4" fill="currentColor">
          <animate attributeName="cx" calcMode="spline" dur="2s" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite" values="5;8;5" />
        </circle>
        <circle cx="19" cy="12" r="4" fill="currentColor">
          <animate attributeName="cx" calcMode="spline" dur="2s" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite" values="19;16;19" />
        </circle>
        <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
      </g>
    </svg>
  );
}