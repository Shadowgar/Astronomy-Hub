import React from "react";
import RowItem from "./RowItem";

export default function DataRow({
  left,
  right,
}) {
  return <RowItem left={left} right={right} />;
}
