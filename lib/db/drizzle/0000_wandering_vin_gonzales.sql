CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"prenom" text NOT NULL,
	"telephone" text NOT NULL,
	"adresse" text NOT NULL,
	"mot_de_passe" text NOT NULL,
	"role" text DEFAULT 'client' NOT NULL,
	"push_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_telephone_unique" UNIQUE("telephone")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"adresse" jsonb NOT NULL,
	"paiement" text DEFAULT 'livraison' NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"total_produits" real DEFAULT 0 NOT NULL,
	"frais_livraison" real DEFAULT 0 NOT NULL,
	"total_final" real DEFAULT 0 NOT NULL,
	"date" text NOT NULL,
	"livreur_id" text,
	"confirme_recu" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
