"use client";

import { SignIn } from "@clerk/nextjs";

const LoginPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <SignIn />
    </div>
  );
};

export default LoginPage;
