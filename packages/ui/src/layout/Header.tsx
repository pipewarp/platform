import { RuntimeControls } from "../components/RuntimeControls.js";


export function Header() {
  return (
    <header>
      <h1>Pipewarp Desktop</h1>
      <RuntimeControls/>
    </header>
  );
}