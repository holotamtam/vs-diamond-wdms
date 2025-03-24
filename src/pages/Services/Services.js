import React from "react";

const Services = () => {

    return (
        <div>
            <button>
                <a href="/DashboardPatient">Go Back to Dashboard</a>
            </button>
            <div>
                <label style={{ marginLeft: "20px", fontWeight: "bold" }}>Basic Services:</label>
                <ul style={{ marginTop: "0.5rem" }}>
                <li>OP (Cleaning) - 1,000 - 3,000</li>
                <li>TF (Temporary Filling) - 900</li>
                <li>PF (Permanent Filling) - 1,000 per surface</li>
                <li>Flouride Treatment - 1,500</li>
                <li>Consultation - 500</li>
                </ul>
            </div>

            <div>
                <label style={{ marginLeft: "20px", fontWeight: "bold" }}>Denture:</label>
                <label style={{ marginLeft: "20px",textDecoration: "underline", fontStyle: "italic", display: "block" }}>Partial Denture</label>
                <ul style={{ marginTop: "0.5rem" }}>
                <li>Acrylic Denture (Plastic) - starts at 5,0000</li>
                <li>Flexible Denture - 10,000 per quadrant/side</li>
                </ul>

                <label style={{ marginLeft: "20px",textDecoration: "underline", fontStyle: "italic", display: "block" }}>Full Denture</label>
                <ul style={{ marginTop: "0.5rem" }}>
                <li>Acrylic Denture - 15,000 per arch</li>
                <li>High Impact Denture - 25,000 per arch</li>
                <li>DG Cryl Denture 25,000 per arch</li>
                </ul>
            </div>

            <div>
                <label style={{ marginLeft: "20px", fontWeight: "bold" }}>Repair:</label>
                <ul style={{ marginTop: "0.5rem" }}>
                <li>Reline (pahugot) - 2,500</li>
                <li>Rebase - 4,000 (replace whole base)</li>
                </ul>
            </div>

            <div>
                <label style={{ marginLeft: "20px", fontWeight: "bold" }}>Extraction & Surgery:</label>
                <ul style={{ marginTop: "0.5rem" }}>
                <li>Simple Tooth Extraction - 1,500 per tooth</li>
                <li>Complicated Extraction - 2,000 - 3,500 per tooth</li>
                <li>Erupted Wisdom Extraction - 3,500 minimum</li>
                <li>Impacted Wisdom Extraction - 10,000 minimum</li>
                </ul>
            </div>

        </div>
    )
}

export default Services;