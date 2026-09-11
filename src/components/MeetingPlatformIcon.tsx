"use client";

import { useId } from "react";
import { platformFromUrl } from "@/lib/dashboardUi";

export default function MeetingPlatformIcon({ url }: { url: string }) {
  const platform = platformFromUrl(url);

  if (platform === "meet") {
    return (
      <span className="shrink-0 w-9 h-9 flex items-center justify-center" title="Google Meet">
        <GoogleMeetMark />
      </span>
    );
  }

  if (platform === "zoom") {
    return (
      <span className="shrink-0 w-9 h-9 flex items-center justify-center" title="Zoom">
        <ZoomMark />
      </span>
    );
  }

  if (platform === "teams") {
    return (
      <span className="shrink-0 w-9 h-9 flex items-center justify-center" title="Microsoft Teams">
        <TeamsMark />
      </span>
    );
  }

  return (
    <span
      className="shrink-0 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
      title="Video call"
    >
      <GenericVideoMark />
    </span>
  );
}

function GoogleMeetMark() {
  const uid = useId().replace(/:/g, "");
  const a = `${uid}-meet-a`;
  const b = `${uid}-meet-b`;
  const c = `${uid}-meet-c`;
  const e = `${uid}-meet-e`;
  const f = `${uid}-meet-f`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      fill="none"
      viewBox="0 0 192 192"
      aria-hidden="true"
    >
      <path
        fill={`url(#${a})`}
        d="M110.015 108.88c-6.829-4.718-6.921-14.778-.179-19.62L165 49.643c7.94-5.701 19-.038 19 9.737v77.755c0 9.675-10.861 15.359-18.821 9.859z"
      />
      <path
        fill={`url(#${b})`}
        d="M8 71c0-24.3 19.7-44 44-44h64c11.046 0 20 8.954 20 20v98c0 11.046-8.954 20-20 20H28c-11.046 0-20-8.954-20-20z"
      />
      <mask
        id={e}
        width="129"
        height="138"
        x="8"
        y="27"
        maskUnits="userSpaceOnUse"
        style={{ maskType: "luminance" }}
      >
        <path
          fill="#fff"
          d="M8 71c0-24.3 19.7-44 44-44h64c11.046 0 20 8.954 20 20v98c0 11.046-8.954 20-20 20H28c-11.046 0-20-8.954-20-20z"
        />
      </mask>
      <g filter={`url(#${c})`} mask={`url(#${e})`}>
        <path fill={`url(#${f})`} d="m73.906 99.198 110-63.198v124z" />
      </g>
      <circle cx="38" cy="135" r="14" fill="#fff" />
      <defs>
        <linearGradient
          id={a}
          x1="128.8"
          x2="227.2"
          y1="104.44"
          y2="104.44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f6a100" />
          <stop offset="1" stopColor="#ffbe00" />
        </linearGradient>
        <linearGradient
          id={f}
          x1="136.22"
          x2="78.5"
          y1="91.32"
          y2="91.19"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".15" stopColor="#ffb5e8" />
          <stop offset="1" stopColor="#ffdbf5" stopOpacity="0" />
        </linearGradient>
        <radialGradient
          id={b}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(-159.725 0 0 -135.852 160.325 96)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".15" stopColor="#ffe921" />
          <stop offset="1" stopColor="#fec700" />
        </radialGradient>
        <filter
          id={c}
          width="166"
          height="180"
          x="45.91"
          y="8"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="14" />
        </filter>
      </defs>
    </svg>
  );
}

function ZoomMark() {
  const uid = useId().replace(/:/g, "");
  const r1 = `${uid}-zoom-r1`;
  const r2 = `${uid}-zoom-r2`;

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit={2}
      aria-hidden="true"
    >
      <path
        d="M512.002 256c0 27.384-2.208 54.224-6.414 80.393-13.916 86.648-82.553 155.285-169.201 169.2a506.136 506.136 0 01-80.394 6.4 506.085 506.085 0 01-80.378-6.4c-86.664-13.915-155.3-82.552-169.217-169.2A508.019 508.019 0 010 255.999a508.17 508.17 0 016.398-80.393C20.314 88.958 88.951 20.32 175.615 6.405A506.085 506.085 0 01255.993.006c27.384 0 54.225 2.192 80.394 6.399 86.648 13.916 155.285 82.553 169.2 169.2A506.283 506.283 0 01512.003 256z"
        fill="#0b5cff"
        fillRule="nonzero"
      />
      <path
        d="M32.009 17c0 1.712-.138 3.39-.401 5.026-.87 5.417-5.161 9.708-10.578 10.578-1.636.263-3.314.4-5.026.4a31.64 31.64 0 01-5.025-.4C5.561 31.734 1.27 27.443.4 22.026a31.76 31.76 0 010-10.052c.87-5.417 5.161-9.708 10.579-10.578a31.64 31.64 0 015.025-.4c1.712 0 3.39.137 5.026.4 5.417.87 9.708 5.161 10.578 10.578.263 1.636.401 3.315.401 5.026z"
        fill={`url(#${r1})`}
        fillRule="nonzero"
        transform="translate(0 -15.925) scale(15.99556)"
      />
      <path
        d="M32.009 17c0 1.711-.138 3.39-.401 5.026-.87 5.417-5.161 9.708-10.578 10.578-1.636.263-3.314.4-5.026.4a31.64 31.64 0 01-5.025-.4C5.561 31.734 1.27 27.443.4 22.026a31.77 31.77 0 010-10.052c.87-5.417 5.161-9.708 10.579-10.578a31.64 31.64 0 015.025-.4c1.712 0 3.39.137 5.026.4 5.417.87 9.708 5.161 10.578 10.578.263 1.636.401 3.315.401 5.026z"
        fill={`url(#${r2})`}
        fillRule="nonzero"
        transform="translate(0 -15.925) scale(15.99556)"
      />
      <path
        d="M310.858 319.997c0 15.148-12.285 27.433-27.433 27.433H164.578c-30.311 0-54.864-24.57-54.864-54.865V192.001c0-15.148 12.284-27.432 27.432-27.432h118.847c30.296 0 54.865 24.569 54.865 54.864v100.564zm69.484-138.969l-40.228 30.168a27.424 27.424 0 00-10.973 21.946v45.715a27.424 27.424 0 0010.973 21.946l40.228 30.167c9.038 6.783 21.946.336 21.946-10.973V192.001c0-11.309-12.908-17.755-21.946-10.973z"
        fill="#fff"
        fillRule="nonzero"
      />
      <defs>
        <radialGradient
          id={r1}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(21.5781 0 0 18.0346 16.004 15.14)"
        >
          <stop offset="0" stopColor="#0b5cff" stopOpacity="0" />
          <stop offset=".82" stopColor="#0b5cff" stopOpacity="0" />
          <stop offset=".98" stopColor="#003cb3" />
          <stop offset="1" stopColor="#003cb3" />
        </radialGradient>
        <radialGradient
          id={r2}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(21.5704 0 0 18.0281 16.004 18.853)"
        >
          <stop offset="0" stopColor="#0b5cff" stopOpacity="0" />
          <stop offset=".8" stopColor="#0b5cff" stopOpacity="0" />
          <stop offset="1" stopColor="#71a5f1" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function TeamsMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none"><path fill="#5059C9" d="M10.765 6.875h3.616c.342 0 .619.276.619.617v3.288a2.272 2.272 0 01-2.274 2.27h-.01a2.272 2.272 0 01-2.274-2.27V7.199c0-.179.145-.323.323-.323zM13.21 6.225c.808 0 1.464-.655 1.464-1.462 0-.808-.656-1.463-1.465-1.463s-1.465.655-1.465 1.463c0 .807.656 1.462 1.465 1.462z"/><path fill="#7B83EB" d="M8.651 6.225a2.114 2.114 0 002.117-2.112A2.114 2.114 0 008.65 2a2.114 2.114 0 00-2.116 2.112c0 1.167.947 2.113 2.116 2.113zM11.473 6.875h-5.97a.611.611 0 00-.596.625v3.75A3.669 3.669 0 008.488 15a3.669 3.669 0 003.582-3.75V7.5a.611.611 0 00-.597-.625z"/><path fill="#000000" d="M8.814 6.875v5.255a.598.598 0 01-.596.595H5.193a3.951 3.951 0 01-.287-1.476V7.5a.61.61 0 01.597-.624h3.31z" opacity=".1"/><path fill="#000000" d="M8.488 6.875v5.58a.6.6 0 01-.596.595H5.347a3.22 3.22 0 01-.267-.65 3.951 3.951 0 01-.172-1.15V7.498a.61.61 0 01.596-.624h2.985z" opacity=".2"/><path fill="#000000" d="M8.488 6.875v4.93a.6.6 0 01-.596.595H5.08a3.951 3.951 0 01-.172-1.15V7.498a.61.61 0 01.596-.624h2.985z" opacity=".2"/><path fill="#000000" d="M8.163 6.875v4.93a.6.6 0 01-.596.595H5.079a3.951 3.951 0 01-.172-1.15V7.498a.61.61 0 01.596-.624h2.66z" opacity=".2"/><path fill="#000000" d="M8.814 5.195v1.024c-.055.003-.107.006-.163.006-.055 0-.107-.003-.163-.006A2.115 2.115 0 016.593 4.6h1.625a.598.598 0 01.596.594z" opacity=".1"/><path fill="#000000" d="M8.488 5.52v.699a2.115 2.115 0 01-1.79-1.293h1.195a.598.598 0 01.595.594z" opacity=".2"/><path fill="#000000" d="M8.488 5.52v.699a2.115 2.115 0 01-1.79-1.293h1.195a.598.598 0 01.595.594z" opacity=".2"/><path fill="#000000" d="M8.163 5.52v.647a2.115 2.115 0 01-1.465-1.242h.87a.598.598 0 01.595.595z" opacity=".2"/><path fill="url(#microsoft-teams-color-16__paint0_linear_2372_494)" d="M1.597 4.925h5.969c.33 0 .597.267.597.596v5.958a.596.596 0 01-.597.596h-5.97A.596.596 0 011 11.479V5.521c0-.33.267-.596.597-.596z"/><path fill="#ffffff" d="M6.152 7.193H4.959v3.243h-.76V7.193H3.01v-.63h3.141v.63z"/><defs><linearGradient id="microsoft-teams-color-16__paint0_linear_2372_494" x1="2.244" x2="6.906" y1="4.46" y2="12.548" gradientUnits="userSpaceOnUse"><stop stop-color="#5A62C3"/><stop offset=".5" stop-color="#4D55BD"/><stop offset="1" stop-color="#3940AB"/></linearGradient></defs></svg>
  );
}

function GenericVideoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="#a8a29e"
        d="M4 8.5A2.5 2.5 0 016.5 6h7A2.5 2.5 0 0116 8.5v7a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 15.5v-7z"
      />
      <path fill="#a8a29e" d="M17 10l4-2.2v8.4L17 14v-4z" />
    </svg>
  );
}
