type Option = {
  id: string;
  label: string;
};

export function MultiSelectChips(props: {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    if (props.selected.includes(id)) {
      props.onChange(props.selected.filter((value) => value !== id));
      return;
    }

    props.onChange([...props.selected, id]);
  }

  return (
    <div className="chip-group">
      {props.options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={props.selected.includes(option.id) ? "chip chip-active" : "chip"}
          onClick={() => toggle(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
