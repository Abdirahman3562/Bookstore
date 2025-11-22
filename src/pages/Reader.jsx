import { useParams } from "react-router-dom";
import { Document, Page } from "react-pdf";

export default function Reader() {
  const { id } = useParams();

  return (
    <div className="w-full flex justify-center p-10">
      <Document file="/sample.pdf">
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}
