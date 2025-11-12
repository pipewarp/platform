type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className="pl-3 ml-2 pr-3 cursor-pointer shadow-md/20 rounded-md bg-cyan-800 text-white"
    />
  );
}
