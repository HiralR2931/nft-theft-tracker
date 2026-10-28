-- Analytical queries
USE NFT_Theft_Database;

# 1. List all verified artists (Simple Query)
SELECT Artist_ID, Name, Wallet_Address, Email, Verification_Status
FROM ARTIST 
WHERE Verification_Status = 'Verified'; 

# 2. Average transaction amount per wallet (Aggregate query)
SELECT Wallet_ID, AVG(Amount) AS Average_Amount, 
MAX(Amount) AS Highest_Transaction, 
MIN(Amount) AS Lowest_Transaction 
FROM TRANSACTION GROUP BY Wallet_ID;


# 3.1. Which investigator resolved which case? (Inner Join) 
select r.Resolved_By,i.Investigator_ID,  i.Name AS Investigator_Name, r.Resolution_Date 
FROM RESOLUTION r 
INNER JOIN INVESTIGATOR i ON r.Resolved_By = i.Investigator_ID ;

# 3.2. Which artworks were transferred the MOST times before theft? (outer join)
SELECT tr.Artwork_ID, COUNT(t.Transaction_ID) 
AS Transfers_Before_Theft 
FROM THEFT_REPORT tr 
JOIN TRANSACTION t ON tr.Artwork_ID = t.Artwork_ID 
AND t.Timestamp < tr.Report_Date 
GROUP BY tr.Artwork_ID 
ORDER BY Transfers_Before_Theft DESC; 


# 4. Wallets that receive above-average total value (Nested Query (Subquery not correlated))
SELECT To_Wallet, SUM(Amount) AS Total_Received
FROM TRANSACTION
GROUP BY To_Wallet
HAVING SUM(Amount) >
(
    SELECT AVG(total_amount)
    FROM (
        SELECT SUM(Amount) AS total_amount
        FROM TRANSACTION
        GROUP BY To_Wallet
    ) x
);


# 5. Total number of transfers per artwork (correlated query(subquery depends on outer query))
SELECT aw.Artwork_ID, aw.Title, 
(
	SELECT COUNT(*) 
	FROM TRANSACTION t 
	WHERE t.Artwork_ID = aw.Artwork_ID) 
	AS Total_Transfers 
	FROM ARTWORK aw; 


# 6.1 Suspicious transactions: highest ever amount for that artwork (>=ALL)
SELECT 
    t.Artwork_ID,
    t.Transaction_ID,
    t.Amount
FROM TRANSACTION t
WHERE t.Amount >= ALL (
    SELECT Amount 
    FROM TRANSACTION t2 
    WHERE t2.Artwork_ID = t.Artwork_ID
);



# 6.2. Artists who have never had a theft report (Not exists)
SELECT 
    a.Artist_ID,
    a.Name
FROM ARTIST a
WHERE NOT EXISTS (
    SELECT 1 
    FROM ARTWORK aw
    JOIN THEFT_REPORT tr 
          ON aw.Artwork_ID = tr.Artwork_ID
    WHERE aw.Artist_ID = a.Artist_ID
);


# 7. Wallets involved in stolen artwork OR high-value transfers (Union)
SELECT DISTINCT From_Wallet AS Wallet
FROM TRANSACTION
WHERE Artwork_ID IN (SELECT Artwork_ID FROM THEFT_REPORT)

UNION

SELECT DISTINCT From_Wallet
FROM TRANSACTION
WHERE Amount > 10000;



# 8 Find artists who have created more artworks than the average number of artworks per artist.(sub queries)
SELECT 
    a.Artist_ID,
    a.Name,
    (
        SELECT COUNT(*) 
        FROM ARTWORK aw 
        WHERE aw.Artist_ID = a.Artist_ID
    ) AS Artwork_Count
FROM ARTIST a
WHERE 
    (
        SELECT COUNT(*) 
        FROM ARTWORK aw 
        WHERE aw.Artist_ID = a.Artist_ID
    ) >
    (
        SELECT AVG(art_count)
        FROM (
            SELECT COUNT(*) AS art_count
            FROM ARTWORK
            GROUP BY Artist_ID
        ) x
    );











# Show all resolution records with the investigator who handled each case.
SELECT
    r.Resolution_ID,
    r.Report_ID,
    i.Name AS Investigator_Name,
    r.Outcome,
    r.Resolution_Date
FROM RESOLUTION r
LEFT JOIN INVESTIGATOR i
    ON r.Resolved_By = i.Investigator_ID;

# ⁠List stolen artworks and investigation status
SELECT 
    aw.Artwork_ID,
    aw.Title,
    tr.Report_ID,
    tr.Status AS Report_Status,
    CASE 
        WHEN inv.Investigation_ID IS NULL THEN 'Not Investigated'
        ELSE 'Investigated'
    END AS Investigation_Status
FROM ARTWORK aw
JOIN THEFT_REPORT tr 
       ON aw.Artwork_ID = tr.Artwork_ID
LEFT JOIN INVESTIGATION inv
       ON tr.Report_ID = inv.Report_ID;