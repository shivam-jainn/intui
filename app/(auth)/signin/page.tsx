"use client";
import { useState } from "react";
import { Button, Checkbox, PasswordInput, TextInput } from "@mantine/core";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const { data, error } = await authClient.signIn.email({ email, password });

      if (error) throw error;
      alert("Login successful!");
      console.log(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TextInput 
        label="Email address" 
        placeholder="hello@gmail.com" 
        size="md" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <PasswordInput 
        label="Password" 
        placeholder="Your password" 
        mt="md" 
        size="md" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <Checkbox label="Keep me logged in" mt="xl" size="md" />
      <Button fullWidth mt="xl" size="md" onClick={onLogin} loading={loading}>
        Login
      </Button>
    </>
  );
}
