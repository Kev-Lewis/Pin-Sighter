// A labelled board-number dropdown (foot board / arrow / breakpoint targeting).
// "Optional" is the empty selection. Styling is global.

type BoardSelectProps = {
  label: string;
  value: string;
  options: number[];
  onChange: (value: string) => void;
};

export function BoardSelect({ label, value, options, onChange }: BoardSelectProps) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Optional</option>
        {options.map((board) => (
          <option key={board} value={board}>
            {board}
          </option>
        ))}
      </select>
    </label>
  );
}
