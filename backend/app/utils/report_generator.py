from __future__ import annotations
import uuid
from pathlib import Path
from typing import Any
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from .excel_processor import REPORTS_DIR, dataframe_preview, json_safe


def numeric_summaries(df: pd.DataFrame) -> list[dict[str, Any]]:
    data = []
    for column in df.select_dtypes(include="number").columns[:8]:
        s = df[column].fillna(0)
        data.append(
            {
                "column": column,
                "total": round(float(s.sum()), 2),
                "average": round(float(s.mean()), 2),
                "min": round(float(s.min()), 2),
                "max": round(float(s.max()), 2),
            }
        )
    return data


def top_categories(df: pd.DataFrame) -> list[dict[str, Any]]:
    data = []
    text_cols = [
        c
        for c in df.columns
        if not pd.api.types.is_numeric_dtype(df[c])
        and not pd.api.types.is_datetime64_any_dtype(df[c])
    ]
    for column in text_cols[:5]:
        counts = df[column].fillna("Unknown").astype(str).value_counts().head(6)
        data.append(
            {
                "column": column,
                "unique_count": int(df[column].nunique(dropna=True)),
                "top_values": [
                    {"name": str(k), "value": int(v)} for k, v in counts.items()
                ],
            }
        )
    return data


def chart_data(df: pd.DataFrame) -> dict[str, Any]:
    numeric_cols = list(df.select_dtypes(include="number").columns)
    date_cols = list(df.select_dtypes(include="datetime").columns)
    text_cols = [c for c in df.columns if c not in numeric_cols and c not in date_cols]
    category_bar, pie_data, line_data = [], [], []
    if text_cols:
        counts = df[text_cols[0]].fillna("Unknown").astype(str).value_counts().head(8)
        category_bar = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
        pie_data = category_bar[:5]
    if date_cols and numeric_cols:
        date_col, numeric_col = date_cols[0], numeric_cols[0]
        grouped = (
            df[[date_col, numeric_col]]
            .dropna(subset=[date_col])
            .groupby(pd.Grouper(key=date_col, freq="D"))[numeric_col]
            .sum()
            .reset_index()
            .sort_values(date_col)
            .tail(12)
        )
        line_data = [
            {
                "date": row[date_col].strftime("%Y-%m-%d"),
                "value": round(float(row[numeric_col]), 2),
            }
            for _, row in grouped.iterrows()
        ]
    return {"category_bar": category_bar, "pie_data": pie_data, "line_data": line_data}


def json_safe_deep(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {str(k): json_safe_deep(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_safe_deep(v) for v in obj]
    return json_safe(obj)


def generate_insights(df: pd.DataFrame, cleaning_summary: dict[str, Any]) -> list[str]:
    insights = []
    numeric, cats = numeric_summaries(df), top_categories(df)
    if numeric:
        highest = max(numeric, key=lambda item: item["total"])
        insights.append(
            f"{highest['column']} has the highest total value ({highest['total']})."
        )
    if cats:
        insights.append(
            f"{cats[0]['column']} has {cats[0]['unique_count']} unique categories."
        )
    if cleaning_summary.get("duplicate_rows_removed", 0) > 0:
        insights.append("Data quality improved after removing duplicate records.")
    if cleaning_summary.get("missing_values_fixed", 0) > 0:
        insights.append(
            "Missing values were fixed using safe defaults for numeric and text fields."
        )
    insights.append(
        "This report is automatically generated from uploaded Excel or CSV data."
    )
    return insights


def create_report_payload(
    df: pd.DataFrame, cleaning_summary: dict[str, Any], original_filename: str
) -> dict[str, Any]:
    payload = {
        "report_title": f"Automation Report - {original_filename}",
        "original_filename": original_filename,
        "summary_cards": {
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "duplicates_removed": int(
                cleaning_summary.get("duplicate_rows_removed", 0)
            ),
            "missing_values_fixed": int(
                cleaning_summary.get("missing_values_fixed", 0)
            ),
        },
        "cleaning_summary": cleaning_summary,
        "numeric_summaries": numeric_summaries(df),
        "top_categories": top_categories(df),
        "chart_data": chart_data(df),
        "preview": dataframe_preview(df, limit=12),
        "insights": generate_insights(df, cleaning_summary),
    }
    return json_safe_deep(payload)


def new_pdf_path(original_filename: str) -> Path:
    return (
        REPORTS_DIR
        / f'{uuid.uuid4().hex}_{Path(original_filename).stem.replace(" ", "_") or "report"}_report.pdf'
    )


def generate_pdf_report(payload: dict[str, Any], output_path: str | Path) -> Path:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "NoctraGridTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
    )
    section = ParagraphStyle(
        "NoctraGridSection",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#0F766E"),
        spaceBefore=14,
        spaceAfter=6,
    )
    story = [
        Paragraph("NoctraGrid Relay", title),
        Paragraph(payload.get("report_title", "Automation Report"), styles["Heading2"]),
        Paragraph(
            "Upload Excel → Clean Data → Generate Smart Report → Email → Store History",
            styles["BodyText"],
        ),
        Spacer(1, 12),
    ]
    cards = payload.get("summary_cards", {})
    card_rows = [
        ["Total Rows", "Total Columns", "Duplicates Removed", "Missing Values Fixed"],
        [
            cards.get("total_rows", 0),
            cards.get("total_columns", 0),
            cards.get("duplicates_removed", 0),
            cards.get("missing_values_fixed", 0),
        ],
    ]
    table = Table(card_rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ECFEFF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Paragraph("Cleaning Summary", section))
    cleaning = payload.get("cleaning_summary", {})
    rows = [
        [k.replace("_", " ").title(), str(v)]
        for k, v in cleaning.items()
        if k not in {"columns_detected", "cleaning_actions"}
    ]
    if rows:
        t = Table([["Metric", "Value"]] + rows[:10], colWidths=[2.4 * inch, 4.2 * inch])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(t)
    story.append(Paragraph("Insights", section))
    for insight in payload.get("insights", []):
        story.append(Paragraph(f"• {insight}", styles["BodyText"]))
    numeric = payload.get("numeric_summaries", [])
    if numeric:
        story.append(Paragraph("Numeric Column Summary", section))
        rows = [["Column", "Total", "Average", "Min", "Max"]] + [
            [i["column"], i["total"], i["average"], i["min"], i["max"]]
            for i in numeric[:6]
        ]
        t = Table(rows, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                    ("PADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(t)
    preview = payload.get("preview", [])
    if preview:
        story.append(Paragraph("Data Preview", section))
        cols = list(preview[0].keys())[:6]
        rows = [cols] + [[str(r.get(c, ""))[:28] for c in cols] for r in preview[:8]]
        t = Table(rows, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("PADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(t)
    doc.build(story)
    return path
