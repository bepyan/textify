import { Link } from '@tanstack/react-router';

import { LogoIcon } from './icons';

export function Gnb() {
  return (
    <header className="fixed inset-x-0 top-0 z-10">
      <div className="h-header flex items-center justify-between gap-8 px-8">
        <Left />
        <Right />
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------------
// GNB left
// ----------------------------------------------------------------------------

function Left() {
  return (
    <div className="flex items-center gap-4">
      <Logo />
    </div>
  );
}

function Logo() {
  return (
    <div className="">
      <Link to="/">
        <LogoIcon className="size-8 fill-current" />
      </Link>
    </div>
  );
}

// ----------------------------------------------------------------------------
// GNB right
// ----------------------------------------------------------------------------

function Right() {
  return <div className="flex items-center gap-4"></div>;
}
