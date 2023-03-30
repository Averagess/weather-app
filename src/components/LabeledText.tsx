interface Props {
  label: string;
  text: string;
}

const LabeledText = ({ label, text }: Props) => {
  return (
    <div className="text-center">
      <p className="text-gray-300">{label}</p>
      <h1 className="text-white text-bold text-2xl">{text}</h1>
    </div>
  );
};

export default LabeledText;
